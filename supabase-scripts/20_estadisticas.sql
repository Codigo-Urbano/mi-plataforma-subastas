
-- Crear tabla para registrar vistas de subastas (Analytics)
CREATE TABLE public.vistas_subastas (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    subasta_id uuid REFERENCES public.subastas(id) ON DELETE CASCADE,
    visitante_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    creado_en timestamp with time zone DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.vistas_subastas ENABLE ROW LEVEL SECURITY;

-- Politicas para vistas
CREATE POLICY "Cualquiera puede insertar vistas" 
ON public.vistas_subastas FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Solo dueños pueden ver las vistas de sus subastas" 
ON public.vistas_subastas FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.subastas 
        WHERE id = vistas_subastas.subasta_id 
        AND vendedor_id = auth.uid()
    )
);

-- Indice para mejorar performance al contar
CREATE INDEX idx_vistas_subasta_id ON public.vistas_subastas(subasta_id);

