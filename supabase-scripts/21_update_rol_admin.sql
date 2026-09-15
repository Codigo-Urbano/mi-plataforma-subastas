
-- Actualiza el rol del usuario principal a admin
-- Nota: En la base de datos real, reemplaza el email por el tuyo propio
UPDATE public.perfiles 
SET rol = 'admin' 
WHERE email = (SELECT email FROM auth.users ORDER BY created_at ASC LIMIT 1);

