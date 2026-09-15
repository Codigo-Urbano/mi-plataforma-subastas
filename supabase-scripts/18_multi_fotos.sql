
-- Añadir un array de strings (URLs) a la tabla subastas para almacenar multiples imagenes
ALTER TABLE public.subastas 
ADD COLUMN IF NOT EXISTS imagenes text[] DEFAULT array[]::text[];

-- Migrar la "imagen_url" actual (si existe) al nuevo array de "imagenes" para no perder las fotos viejas
UPDATE public.subastas 
SET imagenes = ARRAY[imagen_url] 
WHERE imagen_url IS NOT NULL AND array_length(imagenes, 1) IS NULL;

