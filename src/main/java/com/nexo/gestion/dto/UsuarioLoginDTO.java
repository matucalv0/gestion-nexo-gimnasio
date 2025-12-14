package com.nexo.gestion.dto;

import jakarta.validation.constraints.NotBlank;

public record UsuarioLoginDTO(
        @NotBlank
        String username,
        @NotBlank
        String password
) {
}
