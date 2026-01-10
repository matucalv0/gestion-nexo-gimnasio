package com.nexo.gestion.dto;


import jakarta.validation.constraints.NotBlank;

import java.math.BigDecimal;

public record MembresiaDTO(
        Integer idMembresia,
        @NotBlank
        Integer duracionDias,
        @NotBlank
        BigDecimal precioSugerido,
        @NotBlank
        String nombre,
        Integer asistenciasPorSemana,
        boolean estado
) {}
