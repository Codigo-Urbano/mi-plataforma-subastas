-- 1. Cambiar el valor por defecto de la columna 'rol'
ALTER TABLE public.perfiles ALTER COLUMN rol SET DEFAULT 'user';

-- 2. Redefinir el trigger que crea el perfil cuando alguien se registra
-- para asegurar que inserta 'user' y no 'comprador', lo cual violaba
-- la nueva regla de seguridad del panel de administración.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.perfiles (id, email, nombre_completo, telefono, rol, estado)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'nombre_completo',
    new.raw_user_meta_data->>'telefono',
    'user',
    'activo'
  );
  RETURN new;
END;
$$;
