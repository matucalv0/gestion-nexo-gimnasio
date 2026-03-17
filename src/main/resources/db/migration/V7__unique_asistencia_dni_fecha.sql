-- Evitar asistencias duplicadas por concurrencia/problemas de red.
-- Un socio solo puede tener UNA asistencia por día (basado en la fecha local Argentina).
SET TIME ZONE 'America/Argentina/Buenos_Aires';

-- Paso 1: eliminar duplicados existentes conservando la asistencia MÁS RECIENTE de cada día.
DELETE FROM public.asistencia
WHERE (dni, fecha_hora) NOT IN (
    SELECT
        dni,
        MAX(fecha_hora)
    FROM public.asistencia
    GROUP BY dni, CAST(fecha_hora AS DATE)
);

-- Paso 2: crear el índice único para blindar futuros inserts.
CREATE UNIQUE INDEX IF NOT EXISTS uq_asistencia_dni_fecha
    ON public.asistencia (dni, CAST(fecha_hora AS DATE));

