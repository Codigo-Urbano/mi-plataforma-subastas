-- Limpiar restricciones previas que puedan estar dando problemas
ALTER TABLE public.perfiles DROP CONSTRAINT IF EXISTS perfiles_rol_check;
ALTER TABLE public.perfiles DROP CONSTRAINT IF EXISTS perfiles_estado_check;

-- Arreglar los datos primero (No podemos tener 'comprador' o 'vendedor' si vamos a forzar 'user' / 'admin')
-- Opcional: si la columna 'rol' se usaba para 'comprador' / 'vendedor', y ahora la queremos para 'admin' / 'user'
-- vamos a setear todos a 'user' excepto el admin.
UPDATE public.perfiles SET rol = 'user';
UPDATE public.perfiles SET rol = 'admin' WHERE email = 'codigo.urbano.solutions@gmail.com';

-- Aplicar los CHECK correctos
ALTER TABLE public.perfiles ADD CONSTRAINT perfiles_rol_check CHECK (rol IN ('user', 'admin'));
ALTER TABLE public.perfiles ADD CONSTRAINT perfiles_estado_check CHECK (estado IN ('activo', 'suspendido'));

-- Asegurarnos de que el panel_admin y RLS estén correctos
CREATE TABLE IF NOT EXISTS public.auditoria_admin (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_id uuid REFERENCES public.perfiles(id) ON DELETE SET NULL,
    usuario_id uuid REFERENCES public.perfiles(id) ON DELETE CASCADE,
    accion text NOT NULL,
    razon text NOT NULL,
    creado_en timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.auditoria_admin ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins pueden ver todo el historial" ON public.auditoria_admin;
CREATE POLICY "Admins pueden ver todo el historial" ON public.auditoria_admin
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.perfiles
            WHERE id = auth.uid() AND rol = 'admin'
        )
    );

DROP POLICY IF EXISTS "Admins pueden insertar auditorias" ON public.auditoria_admin;
CREATE POLICY "Admins pueden insertar auditorias" ON public.auditoria_admin
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.perfiles
            WHERE id = auth.uid() AND rol = 'admin'
        )
    );
