package com.nexo.gestion.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

import java.time.LocalDate;

public record SocioDTO(
        @NotBlank
        String dni,
        @NotBlank
        String nombre,
        String telefono,
        @Email
        String email,
        @NotBlank
        LocalDate fechaNacimiento,
        boolean activo
)
{}
