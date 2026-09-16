
-- Agregar columna de estado post-subasta
ALTER TABLE subastas 
  ADD COLUMN IF NOT EXISTS post_estado text DEFAULT NULL 
  CHECK (post_estado IN ('pendiente_pago', 'pagado', 'enviado', 'recibido'));

