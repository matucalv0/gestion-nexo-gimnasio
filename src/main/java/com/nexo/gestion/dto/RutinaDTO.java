package com.nexo.gestion.dto;

import jakarta.validation.constraints.NotBlank;
import java.time.LocalDate;
import java.util.List;

public record RutinaDTO(
                Integer idRutina,
                @NotBlank String nombre,
                String descripcion,
                @NotBlank String dniEmpleado,
                String nombreEmpleado,
                String dniSocio,
                String nombreSocio,
                LocalDate fecha,
                Boolean personalizada,
                List<RutinaDetalleDTO> detalles) {
}
