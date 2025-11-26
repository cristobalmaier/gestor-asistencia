-- Migración: Agregar campo 'tarde' a la tabla asistencias
-- Fecha: 2025-11-25
-- Descripción: Agrega soporte para el estado "Tarde" en el registro de asistencias

-- 1. Agregar campo 'tarde' a la tabla asistencias
ALTER TABLE public.asistencias 
ADD COLUMN IF NOT EXISTS tarde boolean DEFAULT false;

-- 2. Agregar comentario al campo para documentación
COMMENT ON COLUMN public.asistencias.tarde IS 'Indica si el alumno llegó tarde';

-- 3. Crear índice para mejorar el rendimiento de consultas
CREATE INDEX IF NOT EXISTS idx_asistencias_tarde 
ON public.asistencias(tarde) 
WHERE tarde = true;

-- 4. Crear índice compuesto para consultas comunes
CREATE INDEX IF NOT EXISTS idx_asistencias_fecha_materia 
ON public.asistencias(fecha, id_materia);

-- Verificación: Mostrar la estructura actualizada de la tabla
-- Ejecuta esto después de la migración para verificar:
-- SELECT column_name, data_type, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'asistencias' 
-- ORDER BY ordinal_position;
