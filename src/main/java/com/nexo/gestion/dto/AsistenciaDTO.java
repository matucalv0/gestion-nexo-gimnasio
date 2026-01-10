package com.nexo.gestion.dto;

import java.time.LocalDateTime;

public record AsistenciaDTO(
        String nombre,
        String dni,
        LocalDateTime fechaHora
) {
}
