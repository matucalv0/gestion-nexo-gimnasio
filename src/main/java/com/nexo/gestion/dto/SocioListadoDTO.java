package com.nexo.gestion.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record SocioListadoDTO(
    String dni,
    String nombre,
    String telefono,
    String email,
    LocalDate fechaNacimiento,
    Boolean activo,
    // Información adicional de membresía
    String nombreMembresia,
    LocalDate fechaVencimiento,
    Integer diasRestantes,
    // Última asistencia
    LocalDateTime ultimaAsistencia,
    Integer diasSinAsistir
) {}

