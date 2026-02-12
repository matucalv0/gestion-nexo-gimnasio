-- Indices adicionales para mejorar rendimiento de consultas frecuentes

-- Indice compuesto para asistencias pendientes por socio
CREATE INDEX IF NOT EXISTS idx_asistencia_dni_estado
ON public.asistencia(dni, estado_asistencia);

-- Indice para buscar asistencias por fecha y dni
CREATE INDEX IF NOT EXISTS idx_asistencia_dni_fecha
ON public.asistencia(dni, fecha_hora);

-- Indice compuesto para socio_membresia (consultas de membresias activas)
CREATE INDEX IF NOT EXISTS idx_socio_membresia_activo_fechas
ON public.socio_membresia(dni_socio, activo, fecha_inicio, fecha_hasta);

-- Indice para buscar socios por nombre (busquedas LIKE)
CREATE INDEX IF NOT EXISTS idx_socio_nombre_lower
ON public.socio(LOWER(nombre));

