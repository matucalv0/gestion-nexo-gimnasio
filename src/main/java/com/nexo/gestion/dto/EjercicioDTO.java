package com.nexo.gestion.dto;

import jakarta.validation.constraints.NotBlank;

public record EjercicioDTO(
                Integer idEjercicio,
                @NotBlank String nombre,
                String descripcion,
                String video,
                @jakarta.validation.constraints.NotNull Integer idGrupoMuscular) {
}
