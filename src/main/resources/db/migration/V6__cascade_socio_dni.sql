ALTER TABLE socio_membresia DROP CONSTRAINT IF EXISTS fk_sm_socio;
ALTER TABLE socio_membresia ADD CONSTRAINT fk_sm_socio FOREIGN KEY (dni_socio) REFERENCES public.socio(dni) ON UPDATE CASCADE;

ALTER TABLE usuario DROP CONSTRAINT IF EXISTS fk_usuario_socio;
ALTER TABLE usuario ADD CONSTRAINT fk_usuario_socio FOREIGN KEY (socio_dni) REFERENCES public.socio(dni) ON UPDATE CASCADE;

ALTER TABLE rutina DROP CONSTRAINT IF EXISTS fk_rutina_socio;
ALTER TABLE rutina ADD CONSTRAINT fk_rutina_socio FOREIGN KEY (dni_socio) REFERENCES public.socio(dni) ON UPDATE CASCADE ON DELETE CASCADE;

-- Si asistencia no tiene FK (fue generada manual o en otro momento), la agregamos (usando ON UPDATE CASCADE) para mantener integridad, pre-borrando huerfanos si hay
DELETE FROM asistencia WHERE dni NOT IN (SELECT dni FROM socio);

ALTER TABLE asistencia DROP CONSTRAINT IF EXISTS fk_asistencia_socio;
ALTER TABLE asistencia 
ADD CONSTRAINT fk_asistencia_socio 
FOREIGN KEY (dni) 
REFERENCES public.socio(dni) 
ON UPDATE CASCADE;
