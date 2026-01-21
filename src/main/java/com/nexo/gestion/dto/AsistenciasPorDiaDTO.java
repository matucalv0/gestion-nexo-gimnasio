package com.nexo.gestion.dto;

import java.time.LocalDate;

public record AsistenciasPorDiaDTO(
        LocalDate fecha,
        Long totalAsistencias
) {
}
