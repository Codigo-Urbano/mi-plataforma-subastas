
-- Crear tabla de favoritos
CREATE TABLE IF NOT EXISTS public.favoritos (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    usuario_id uuid REFERENCES public.perfiles(id) ON DELETE CASCADE NOT NULL,
    subasta_id uuid REFERENCES public.subastas(id) ON DELETE CASCADE NOT NULL,
    creado_en timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(usuario_id, subasta_id)
);

-- Habilitar RLS
ALTER TABLE public.favoritos ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad
CREATE POLICY "Usuarios pueden ver sus propios favoritos" ON public.favoritos
    FOR SELECT USING (auth.uid() = usuario_id);

CREATE POLICY "Usuarios pueden agregar favoritos" ON public.favoritos
    FOR INSERT WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Usuarios pueden eliminar sus favoritos" ON public.favoritos
    FOR DELETE USING (auth.uid() = usuario_id);

