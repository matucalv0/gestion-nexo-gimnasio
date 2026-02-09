package com.nexo.gestion.dto;

public record RutinaDetalleRequestDTO(
        Long idDetalle,
        Integer idEjercicio,
        Integer orden,
        String series,
        String repeticiones,
        String carga,
        String descanso,
        String observacion,
        Integer dia) {
}
