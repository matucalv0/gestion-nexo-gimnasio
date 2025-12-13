package com.nexo.gestion.dto;

import com.nexo.gestion.entity.Puesto;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

import java.time.LocalDate;

public record EmpleadoDTO(
        @NotBlank
        String dni,
        @NotBlank
        String nombre,
        String telefono,
        @Email
        String email,
        @NotBlank
        LocalDate fecha_nacimiento,
        Boolean activo,
        Integer id_puesto
) {}

