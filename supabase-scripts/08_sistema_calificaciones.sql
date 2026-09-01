-- Crear la tabla de Calificaciones
CREATE TABLE calificaciones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subasta_id UUID NOT NULL REFERENCES subastas(id) ON DELETE CASCADE,
    evaluador_id UUID NOT NULL REFERENCES perfiles(id) ON DELETE CASCADE,
    evaluado_id UUID NOT NULL REFERENCES perfiles(id) ON DELETE CASCADE,
    rol_evaluador TEXT NOT NULL CHECK (rol_evaluador IN ('comprador', 'vendedor')),
    puntuacion INTEGER NOT NULL CHECK (puntuacion >= 1 AND puntuacion <= 5),
    comentario TEXT,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Evitar que un usuario califique a la misma persona por la misma subasta más de una vez
    UNIQUE(subasta_id, evaluador_id)
);

-- Configurar Seguridad de Nivel de Fila (RLS)
ALTER TABLE calificaciones ENABLE ROW LEVEL SECURITY;

-- 1. Cualquiera puede ver las calificaciones (necesario para mostrar promedios públicos)
CREATE POLICY "Calificaciones son públicas para lectura" 
ON calificaciones FOR SELECT 
USING (true);

-- 2. Solo los usuarios autenticados pueden insertar sus propias calificaciones
CREATE POLICY "Usuarios pueden insertar sus propias calificaciones" 
ON calificaciones FOR INSERT 
WITH CHECK (auth.uid() = evaluador_id);

-- Función para calcular el promedio rápidamente (Opcional pero útil para vistas)
CREATE OR REPLACE VIEW vista_reputacion AS
SELECT 
    evaluado_id as perfil_id,
    ROUND(AVG(puntuacion)::numeric, 1) as promedio_estrellas,
    COUNT(id) as total_resenas
FROM calificaciones
GROUP BY evaluado_id;
