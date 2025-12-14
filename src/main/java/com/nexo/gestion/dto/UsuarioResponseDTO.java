package com.nexo.gestion.dto;

import com.nexo.gestion.entity.Rol;
import jakarta.validation.constraints.NotBlank;

public record UsuarioResponseDTO(
        @NotBlank
        String username,
        @NotBlank
        Rol rol,
        @NotBlank
        String dni
) {
}
