package com.nexo.gestion.dto;

import java.util.List;

public record RutinaImportDTO(
        String nombre,
        String dniEmpleado,
        String dniSocio,
        String descripcion,
        List<RutinaDetalleImportDTO> detalles) {
}
