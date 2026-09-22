
-- 1. CREAR TABLA PARA TOPES MÁXIMOS (PROXY BIDDING)
CREATE TABLE IF NOT EXISTS public.ofertas_automaticas (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    subasta_id uuid REFERENCES public.subastas(id) ON DELETE CASCADE,
    comprador_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    monto_maximo numeric NOT NULL,
    fecha_actualizacion timestamp with time zone DEFAULT now(),
    UNIQUE (subasta_id, comprador_id)
);

-- Habilitar RLS estricto para que los topes sean absolutamente privados
ALTER TABLE public.ofertas_automaticas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios solo pueden ver sus propios topes"
ON public.ofertas_automaticas FOR SELECT TO authenticated
USING (comprador_id = auth.uid());

CREATE POLICY "Usuarios pueden actualizar sus topes"
ON public.ofertas_automaticas FOR ALL TO authenticated
USING (comprador_id = auth.uid())
WITH CHECK (comprador_id = auth.uid());


-- 2. FUNCIÓN DE CÁLCULO DE INCREMENTO DINÁMICO (ESCALAS)
CREATE OR REPLACE FUNCTION public.calcular_incremento(precio_actual numeric)
RETURNS numeric
LANGUAGE plpgsql
AS \$\$
BEGIN
    IF precio_actual < 10000 THEN
        RETURN 500;
    ELSIF precio_actual < 50000 THEN
        RETURN 1000;
    ELSIF precio_actual < 200000 THEN
        RETURN 2500;
    ELSIF precio_actual < 1000000 THEN
        RETURN 10000;
    ELSE
        RETURN 25000;
    END IF;
END;
\$\$;


-- 3. REDEFINIR EL MOTOR PRINCIPAL DE PUJAS (PROCESAR PUJA CON PROXY BIDDING)
CREATE OR REPLACE FUNCTION public.procesar_puja(p_subasta_id uuid, p_monto numeric)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS \$\$
DECLARE
    v_subasta RECORD;
    v_comprador_id uuid;
    v_lider_actual RECORD;
    v_incremento numeric;
    v_nuevo_precio numeric;
BEGIN
    v_comprador_id := auth.uid();
    
    IF v_comprador_id IS NULL THEN
        RAISE EXCEPTION 'Usuario no autenticado';
    END IF;

    -- Obtener la subasta con bloqueo (Race condition lock)
    SELECT * INTO v_subasta 
    FROM public.subastas 
    WHERE id = p_subasta_id AND estado = 'activa'
    FOR UPDATE;

    IF v_subasta.id IS NULL THEN
        RAISE EXCEPTION 'Subasta no encontrada o no está activa';
    END IF;

    IF v_subasta.vendedor_id = v_comprador_id THEN
        RAISE EXCEPTION 'No puedes pujar en tu propia subasta.';
    END IF;

    -- Buscar al líder actual y su monto máximo en el Proxy (si existe)
    SELECT p.comprador_id, COALESCE(oa.monto_maximo, p.monto) as monto_maximo
    INTO v_lider_actual
    FROM public.pujas p
    LEFT JOIN public.ofertas_automaticas oa 
      ON p.comprador_id = oa.comprador_id AND p.subasta_id = oa.subasta_id
    WHERE p.subasta_id = p_subasta_id
    ORDER BY p.monto DESC, p.creada_en ASC
    LIMIT 1;

    v_incremento := public.calcular_incremento(v_subasta.precio_actual);

    -- Si no hay líder o somos el primer pujador de la historia
    IF v_lider_actual IS NULL THEN
        IF p_monto < v_subasta.precio_base THEN
            RAISE EXCEPTION 'El monto debe ser mayor o igual al precio base (%)', v_subasta.precio_base;
        END IF;

        -- Registrar tope máximo
        INSERT INTO public.ofertas_automaticas (subasta_id, comprador_id, monto_maximo)
        VALUES (p_subasta_id, v_comprador_id, p_monto)
        ON CONFLICT (subasta_id, comprador_id) 
        DO UPDATE SET monto_maximo = p_monto, fecha_actualizacion = now();

        -- Puja inicial por el precio base
        INSERT INTO public.pujas (subasta_id, comprador_id, monto)
        VALUES (p_subasta_id, v_comprador_id, v_subasta.precio_base);

        UPDATE public.subastas SET precio_actual = v_subasta.precio_base WHERE id = p_subasta_id;
        
    -- Si el nuevo pujador es el mismo líder actual (solo quiere aumentar su tope secreto)
    ELSIF v_lider_actual.comprador_id = v_comprador_id THEN
        IF p_monto <= v_lider_actual.monto_maximo THEN
            RAISE EXCEPTION 'El nuevo monto máximo debe ser mayor al que ya tienes configurado.';
        END IF;
        
        -- Solo actualizamos su tope, no el precio actual
        UPDATE public.ofertas_automaticas 
        SET monto_maximo = p_monto, fecha_actualizacion = now()
        WHERE subasta_id = p_subasta_id AND comprador_id = v_comprador_id;
        
    -- COMBATE DE PUJAS (Alguien nuevo intenta superar al líder actual)
    ELSE
        -- Validación estricta para entrar a la pelea
        IF p_monto < (v_subasta.precio_actual + v_incremento) THEN
            RAISE EXCEPTION 'Tu tope debe superar el precio actual por al menos %', v_incremento;
        END IF;

        -- El nuevo retador pierde (Su tope no alcanza a vencer el tope secreto del líder)
        IF p_monto <= v_lider_actual.monto_maximo THEN
            
            -- Guardamos el intento fallido del retador en el historial (por su tope máximo)
            INSERT INTO public.pujas (subasta_id, comprador_id, monto)
            VALUES (p_subasta_id, v_comprador_id, p_monto);

            -- El líder contrataca automáticamente
            v_nuevo_precio := LEAST(p_monto + public.calcular_incremento(p_monto), v_lider_actual.monto_maximo);
            
            INSERT INTO public.pujas (subasta_id, comprador_id, monto)
            VALUES (p_subasta_id, v_lider_actual.comprador_id, v_nuevo_precio);

            UPDATE public.subastas SET precio_actual = v_nuevo_precio WHERE id = p_subasta_id;

            -- Registramos o actualizamos el tope del perdedor en la tabla para historial
            INSERT INTO public.ofertas_automaticas (subasta_id, comprador_id, monto_maximo)
            VALUES (p_subasta_id, v_comprador_id, p_monto)
            ON CONFLICT (subasta_id, comprador_id) DO UPDATE SET monto_maximo = p_monto, fecha_actualizacion = now();

        -- El nuevo retador gana (Su tope es mayor al tope secreto del líder)
        ELSE
            -- El líder saliente da su último golpe (puja con su máximo)
            INSERT INTO public.pujas (subasta_id, comprador_id, monto)
            VALUES (p_subasta_id, v_lider_actual.comprador_id, v_lider_actual.monto_maximo);

            -- El nuevo retador supera al antiguo líder por un incremento
            v_nuevo_precio := LEAST(v_lider_actual.monto_maximo + public.calcular_incremento(v_lider_actual.monto_maximo), p_monto);

            INSERT INTO public.pujas (subasta_id, comprador_id, monto)
            VALUES (p_subasta_id, v_comprador_id, v_nuevo_precio);

            -- Guardar tope del nuevo líder
            INSERT INTO public.ofertas_automaticas (subasta_id, comprador_id, monto_maximo)
            VALUES (p_subasta_id, v_comprador_id, p_monto)
            ON CONFLICT (subasta_id, comprador_id) DO UPDATE SET monto_maximo = p_monto, fecha_actualizacion = now();

            UPDATE public.subastas SET precio_actual = v_nuevo_precio WHERE id = p_subasta_id;
        END IF;
    END IF;

    -- Lógica anti-sniper
    IF v_subasta.anti_sniper = true THEN
        IF (v_subasta.fecha_fin - now()) < interval '5 minutes' THEN
            UPDATE public.subastas
            SET fecha_fin = v_subasta.fecha_fin + interval '5 minutes'
            WHERE id = p_subasta_id;
        END IF;
    END IF;
END;
\$\$;

