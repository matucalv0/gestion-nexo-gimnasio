package com.nexo.gestion.dto;

import jakarta.validation.constraints.NotBlank;

public record RutinaDTO(
        @NotBlank
        String nombre,
        @NotBlank
        String descripcion,
        @NotBlank
        String dniEmpleado,
        String dniSocio
) {
}
