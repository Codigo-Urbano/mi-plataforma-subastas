-- Crear tabla de configuración de sistema
CREATE TABLE IF NOT EXISTS public.configuracion_sistema (
    id integer PRIMARY KEY CHECK (id = 1),
    comision_minima numeric NOT NULL DEFAULT 2000,
    escala_1_tope numeric NOT NULL DEFAULT 5000000,
    escala_1_porcentaje numeric NOT NULL DEFAULT 0.05,
    escala_2_tope numeric NOT NULL DEFAULT 20000000,
    escala_2_porcentaje numeric NOT NULL DEFAULT 0.03,
    escala_3_porcentaje numeric NOT NULL DEFAULT 0.02,
    actualizado_en timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.configuracion_sistema ENABLE ROW LEVEL SECURITY;

-- Cualquiera puede leer la configuración (necesario para el checkout y frontend)
DROP POLICY IF EXISTS "Todos pueden leer la configuracion" ON public.configuracion_sistema;
CREATE POLICY "Todos pueden leer la configuracion" ON public.configuracion_sistema
    FOR SELECT USING (true);

-- Solo el admin puede modificar
DROP POLICY IF EXISTS "Admins pueden actualizar configuracion" ON public.configuracion_sistema;
CREATE POLICY "Admins pueden actualizar configuracion" ON public.configuracion_sistema
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.perfiles
            WHERE id = auth.uid() AND rol = 'admin'
        )
    );

DROP POLICY IF EXISTS "Admins pueden insertar configuracion" ON public.configuracion_sistema;
CREATE POLICY "Admins pueden insertar configuracion" ON public.configuracion_sistema
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.perfiles
            WHERE id = auth.uid() AND rol = 'admin'
        )
    );

-- Insertar valor por defecto si no existe
INSERT INTO public.configuracion_sistema (id) VALUES (1) ON CONFLICT (id) DO NOTHING;
