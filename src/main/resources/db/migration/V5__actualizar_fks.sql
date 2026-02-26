ALTER TABLE pago
DROP CONSTRAINT fk_pago_socio;

ALTER TABLE pago
ADD CONSTRAINT fk_pago_socio
FOREIGN KEY (dni_socio)
REFERENCES socio(dni)
ON UPDATE CASCADE;

ALTER TABLE pago
DROP CONSTRAINT fk_pago_empleado;

ALTER TABLE pago
ADD CONSTRAINT fk_pago_empleado
FOREIGN KEY (dni_empleado)
REFERENCES empleado(dni)
ON UPDATE CASCADE;
