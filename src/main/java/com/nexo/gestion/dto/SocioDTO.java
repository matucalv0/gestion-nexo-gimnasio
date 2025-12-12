package com.nexo.gestion.dto;

import java.time.LocalDate;

public record SocioDTO(
        String dni,
        String nombre,
        String telefono,
        String email,
        LocalDate fecha_nacimiento,
        boolean activo
)
{}
