-- 1. Añadir columnas de rol y estado a la tabla perfiles
ALTER TABLE public.perfiles
ADD COLUMN IF NOT EXISTS rol text DEFAULT 'user' CHECK (rol IN ('user', 'admin')),
ADD COLUMN IF NOT EXISTS estado text DEFAULT 'activo' CHECK (estado IN ('activo', 'suspendido'));

-- 2. Crear tabla de auditoría para registrar las acciones administrativas
CREATE TABLE IF NOT EXISTS public.auditoria_admin (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_id uuid REFERENCES public.perfiles(id) ON DELETE SET NULL,
    usuario_id uuid REFERENCES public.perfiles(id) ON DELETE CASCADE,
    accion text NOT NULL,
    razon text NOT NULL,
    creado_en timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Habilitar RLS en la tabla de auditoría
ALTER TABLE public.auditoria_admin ENABLE ROW LEVEL SECURITY;

-- 4. Políticas de Seguridad (RLS) para auditoria_admin
-- Solo los administradores pueden leer y escribir en esta tabla
CREATE POLICY "Admins pueden ver todo el historial" ON public.auditoria_admin
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.perfiles
            WHERE id = auth.uid() AND rol = 'admin'
        )
    );

CREATE POLICY "Admins pueden insertar auditorias" ON public.auditoria_admin
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.perfiles
            WHERE id = auth.uid() AND rol = 'admin'
        )
    );

-- 5. Dar permisos de administrador al correo indicado
UPDATE public.perfiles 
SET rol = 'admin' 
WHERE email = 'codigo.urbano.solutions@gmail.com';
