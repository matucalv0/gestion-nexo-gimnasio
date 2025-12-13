package com.nexo.gestion.dto;

import com.nexo.gestion.entity.Puesto;

import java.time.LocalDate;

public record EmpleadoDTO(
        String dni,
        String nombre,
        String telefono,
        String email,
        LocalDate fecha_nacimiento,
        Boolean activo,
        Integer id_puesto
) {}

