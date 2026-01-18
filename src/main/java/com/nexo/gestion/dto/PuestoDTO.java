package com.nexo.gestion.dto;

import jakarta.validation.constraints.NotBlank;

public record PuestoDTO(
        Integer idPuesto,
        @NotBlank
        String nombre
) {
    public PuestoDTO(String nombre){
        this(null, nombre);

    }
}
