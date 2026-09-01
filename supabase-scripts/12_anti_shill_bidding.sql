-- Prevenir el Shill Bidding (Auto-pujas fraudulentas)
-- Redefinimos la función de procesamiento de pujas para incluir la regla de seguridad

CREATE OR REPLACE FUNCTION public.procesar_puja(p_subasta_id uuid, p_monto numeric)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_subasta RECORD;
    v_comprador_id uuid;
BEGIN
    v_comprador_id := auth.uid();
    
    IF v_comprador_id IS NULL THEN
        RAISE EXCEPTION 'Usuario no autenticado';
    END IF;

    -- Obtener la subasta con bloqueo para concurrencia (evita race conditions)
    SELECT * INTO v_subasta 
    FROM public.subastas 
    WHERE id = p_subasta_id AND estado = 'activa'
    FOR UPDATE;

    IF v_subasta.id IS NULL THEN
        RAISE EXCEPTION 'Subasta no encontrada o no está activa';
    END IF;

    -- [NUEVA REGLA] Validar que el comprador no sea el propio vendedor 
    IF v_subasta.vendedor_id = v_comprador_id THEN
        RAISE EXCEPTION 'No puedes pujar en tu propia subasta.';
    END IF;

    IF p_monto <= v_subasta.precio_actual THEN
        RAISE EXCEPTION 'El monto debe ser mayor al precio actual';
    END IF;

    -- Insertar la puja
    INSERT INTO public.pujas (subasta_id, comprador_id, monto)
    VALUES (p_subasta_id, v_comprador_id, p_monto);

    -- Actualizar el precio de la subasta
    UPDATE public.subastas
    SET precio_actual = p_monto
    WHERE id = p_subasta_id;
    
    -- Lógica anti-sniper: Si quedan menos de 5 minutos, extender la subasta 5 minutos más
    IF v_subasta.anti_sniper = true THEN
        IF (v_subasta.fecha_fin - now()) < interval '5 minutes' THEN
            UPDATE public.subastas
            SET fecha_fin = v_subasta.fecha_fin + interval '5 minutes'
            WHERE id = p_subasta_id;
        END IF;
    END IF;
END;
$$;
