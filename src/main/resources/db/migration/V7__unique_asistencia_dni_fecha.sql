-- Evitar asistencias duplicadas por concurrencia/problemas de red.
-- Un socio solo puede tener UNA asistencia por día (fecha local Argentina UTC-3).

-- Paso 0: función auxiliar IMMUTABLE para obtener la fecha en Argentina (UTC-3).
-- Se declara IMMUTABLE explícitamente para poder usarse en índices.
CREATE OR REPLACE FUNCTION fecha_arg(ts timestamptz)
RETURNS date AS $$
    SELECT (ts AT TIME ZONE INTERVAL '-3:00')::date
$$ LANGUAGE sql IMMUTABLE PARALLEL SAFE;

-- Paso 1: eliminar duplicados existentes conservando la asistencia MÁS RECIENTE de cada día.
DELETE FROM public.asistencia
WHERE (dni, fecha_hora) NOT IN (
    SELECT
        dni,
        MAX(fecha_hora)
    FROM public.asistencia
    GROUP BY dni, fecha_arg(fecha_hora)
);

-- Paso 2: crear el índice único para blindar futuros inserts.
CREATE UNIQUE INDEX IF NOT EXISTS uq_asistencia_dni_fecha
    ON public.asistencia (dni, fecha_arg(fecha_hora));
