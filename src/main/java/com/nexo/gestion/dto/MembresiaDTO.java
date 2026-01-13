package com.nexo.gestion.dto;


import com.nexo.gestion.entity.TipoMembresia;
import jakarta.validation.constraints.NotBlank;

import java.math.BigDecimal;

public record MembresiaDTO(
        Integer idMembresia,
        @NotBlank
        Integer duracionDias,
        @NotBlank
        BigDecimal precioSugerido,
        @NotBlank
        String nombre,
        TipoMembresia tipoMembresia,
        Integer asistenciasPorSemana,
        boolean estado
) {}
