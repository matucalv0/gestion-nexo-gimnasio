create table if not exists public.descuento (
      id_descuento serial primary key,
      nombre varchar(50) not null,
      porcentaje numeric(10,2) not null,
      activo boolean default true,
      constraint ck_porcentaje check (porcentaje > 0)
);



ALTER TABLE public.pago 
ADD COLUMN id_descuento integer;

ALTER TABLE public.pago
ADD CONSTRAINT fk_pago_descuento 
FOREIGN KEY (id_descuento) 
REFERENCES public.descuento (id_descuento);



