-- Migración: Agregar soporte de múltiples cargas en RutinaDetalle
-- Creada: 2026-02-06
-- Esta migración permite almacenar múltiples cargas (una por día/semana) en cada detalle de rutina

-- Crear tabla para almacenar múltiples cargas
CREATE TABLE IF NOT EXISTS public.rutina_detalle_cargas (
    id_detalle BIGINT NOT NULL,
    carga_indice INTEGER NOT NULL,
    carga_valor VARCHAR(50),
    PRIMARY KEY (id_detalle, carga_indice),
    CONSTRAINT fk_rutina_detalle_cargas FOREIGN KEY (id_detalle) 
        REFERENCES public.rutina_detalle(id_detalle) ON DELETE CASCADE
);

-- Crear índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_rutina_detalle_cargas_detalle 
ON public.rutina_detalle_cargas(id_detalle);

-- Nota: La columna 'carga' en rutina_detalle se mantendrá como la carga principal
-- La tabla rutina_detalle_cargas almacena cargas adicionales o variaciones
