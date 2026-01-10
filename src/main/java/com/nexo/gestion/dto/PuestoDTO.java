package com.nexo.gestion.dto;

import jakarta.validation.constraints.NotBlank;

public record PuestoDTO(
        Integer idPuesto,
        @NotBlank
        String nombre
) {}
