
-- Permitir que los dueños actualicen sus subastas incluso si ya están insertadas
-- Verificamos si existe una política de UPDATE, si no la creamos
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'subastas' 
        AND policyname = 'Usuarios pueden actualizar sus propias subastas'
    ) THEN
        CREATE POLICY "Usuarios pueden actualizar sus propias subastas" ON public.subastas
            FOR UPDATE USING (auth.uid() = vendedor_id);
    END IF;
END
$$;

