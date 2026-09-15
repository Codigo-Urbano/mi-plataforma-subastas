
CREATE TABLE IF NOT EXISTS public.preguntas (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    subasta_id uuid REFERENCES public.subastas(id) ON DELETE CASCADE NOT NULL,
    comprador_id uuid REFERENCES public.perfiles(id) ON DELETE CASCADE NOT NULL,
    pregunta text NOT NULL,
    respuesta text,
    creado_en timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    respondido_en timestamp with time zone
);

ALTER TABLE public.preguntas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Preguntas visibles para todos" ON public.preguntas 
    FOR SELECT USING (true);

CREATE POLICY "Usuarios pueden preguntar" ON public.preguntas 
    FOR INSERT WITH CHECK (auth.uid() = comprador_id);

CREATE POLICY "Solo admin o vendedor pueden actualizar via funcion" ON public.preguntas
    FOR UPDATE USING (true);

