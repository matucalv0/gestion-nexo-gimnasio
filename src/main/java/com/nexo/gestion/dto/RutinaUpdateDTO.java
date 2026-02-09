package com.nexo.gestion.dto;

import jakarta.validation.constraints.NotNull;
import java.util.List;

public record RutinaUpdateDTO(
        @NotNull Integer idRutina,
        String nombre,
        String descripcion,
        String dniSocio,
        List<RutinaDetalleRequestDTO> detalles) {
}
