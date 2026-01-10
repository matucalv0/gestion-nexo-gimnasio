package com.nexo.gestion.dto;

import java.time.LocalDateTime;

public record AsistenciaSocioIdDTO(
        String dniSocio,
        LocalDateTime fechaHora
) {}
