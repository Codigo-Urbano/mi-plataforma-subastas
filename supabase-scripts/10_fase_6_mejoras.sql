-- 1. Añadir nickname a perfiles
ALTER TABLE public.perfiles
ADD COLUMN IF NOT EXISTS nickname text UNIQUE;

-- Actualizar perfiles existentes dándoles un nickname por defecto basado en su nombre o id
UPDATE public.perfiles
SET nickname = COALESCE(
    REPLACE(LOWER(nombre_completo), ' ', '_'),
    'user_' || substr(id::text, 1, 8)
)
WHERE nickname IS NULL;

-- Hacer el nickname obligatorio para futuros registros
ALTER TABLE public.perfiles
ALTER COLUMN nickname SET NOT NULL;

-- 2. Añadir categoria a subastas
ALTER TABLE public.subastas
ADD COLUMN IF NOT EXISTS categoria text DEFAULT 'Otros' CHECK (categoria IN ('Vehículos', 'Inmuebles', 'Electrónica', 'Hogar', 'Arte y Colecciones', 'Otros'));

-- 3. Crear tabla para mensajes de contacto
CREATE TABLE IF NOT EXISTS public.mensajes_contacto (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    nombre text NOT NULL,
    email text NOT NULL,
    motivo text NOT NULL,
    mensaje text NOT NULL,
    leido boolean DEFAULT false,
    creado_en timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Habilitar RLS en mensajes_contacto
ALTER TABLE public.mensajes_contacto ENABLE ROW LEVEL SECURITY;

-- 5. Políticas para mensajes_contacto
-- Cualquiera puede insertar (incluso usuarios no registrados)
CREATE POLICY "Cualquiera puede enviar mensajes" ON public.mensajes_contacto
    FOR INSERT WITH CHECK (true);

-- Solo admins pueden leer
CREATE POLICY "Admins pueden leer mensajes" ON public.mensajes_contacto
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.perfiles
            WHERE id = auth.uid() AND rol = 'admin'
        )
    );
