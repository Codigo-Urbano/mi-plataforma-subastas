
-- 1. Agregar columnas a la tabla perfiles
ALTER TABLE perfiles 
  ADD COLUMN IF NOT EXISTS kyc_status text DEFAULT 'pendiente' CHECK (kyc_status IN ('pendiente', 'en_revision', 'aprobado', 'rechazado')),
  ADD COLUMN IF NOT EXISTS kyc_doc_frente text,
  ADD COLUMN IF NOT EXISTS kyc_doc_dorso text,
  ADD COLUMN IF NOT EXISTS kyc_selfie text;

-- 2. Crear bucket privado para documentos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('kyc_documentos', 'kyc_documentos', false)
ON CONFLICT (id) DO NOTHING;

-- 3. Políticas de seguridad (RLS) para el bucket 'kyc_documentos'
-- a. Los usuarios pueden subir archivos a su propia carpeta
CREATE POLICY "Usuarios pueden subir sus propios documentos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'kyc_documentos' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

-- b. Los usuarios pueden ver sus propios archivos
CREATE POLICY "Usuarios pueden ver sus propios documentos"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'kyc_documentos' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

-- c. Los administradores pueden ver todos los archivos
CREATE POLICY "Admins pueden ver todos los documentos"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'kyc_documentos' AND 
  EXISTS (
    SELECT 1 FROM public.perfiles
    WHERE id = auth.uid() AND rol = 'admin'
  )
);

