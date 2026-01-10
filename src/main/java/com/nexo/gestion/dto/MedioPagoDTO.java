package com.nexo.gestion.dto;

import jakarta.validation.constraints.NotBlank;

public record MedioPagoDTO(
        Integer idMedioPago,
        @NotBlank
        String nombre
) {}
