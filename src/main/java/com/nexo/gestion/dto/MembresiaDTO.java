package com.nexo.gestion.dto;


import jakarta.validation.constraints.NotBlank;

import java.math.BigDecimal;

public record MembresiaDTO(
        Integer id_membresia,
        @NotBlank
        Integer duracion_dias,
        @NotBlank
        BigDecimal precio_sugerido,
        @NotBlank
        String nombre
) {}
