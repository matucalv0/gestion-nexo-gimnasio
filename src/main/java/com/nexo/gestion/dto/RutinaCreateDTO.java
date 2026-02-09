package com.nexo.gestion.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public record RutinaCreateDTO(
    @NotBlank String nombre,
    String descripcion,
    @NotNull String dniEmpleado,
    String dniSocio,
    @JsonProperty("detalles") List<RutinaDetalleRequestDTO> detalles
) {}
