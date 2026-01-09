package com.nexo.gestion.dto;

import jakarta.validation.constraints.NotBlank;

public record EjercicioDTO(
        @NotBlank
        String nombre,
        @NotBlank
        String descripcion,
        String video,
        Integer idGrupoMuscular
) {}
