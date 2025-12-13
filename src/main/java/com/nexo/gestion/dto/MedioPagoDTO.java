package com.nexo.gestion.dto;

import jakarta.validation.constraints.NotBlank;

public record MedioPagoDTO(
        Integer id_medioPago,
        @NotBlank
        String nombre
) {}
