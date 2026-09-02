-- Eliminar restricciones del nickname para permitir registros sin él
ALTER TABLE public.perfiles ALTER COLUMN nickname DROP NOT NULL;
ALTER TABLE public.perfiles DROP CONSTRAINT IF EXISTS perfiles_nickname_key;

-- Nota: Dejamos la columna en la tabla por si algunos usuarios antiguos la tienen,
-- o la puedes eliminar completamente si lo deseas con:
-- ALTER TABLE public.perfiles DROP COLUMN nickname;
