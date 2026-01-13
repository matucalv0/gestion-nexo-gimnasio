package com.nexo.gestion.dto;

import com.nexo.gestion.entity.Rol;
import jakarta.validation.constraints.NotBlank;


public record UsuarioDTO(
        @NotBlank
        String username,
        @NotBlank
        String password,
        @NotBlank
        Rol rol,
        String dni
) {}
