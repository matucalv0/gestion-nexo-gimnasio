package com.nexo.gestion.dto;

import java.math.BigDecimal;
import java.util.List;

public record EstadisticasAsistenciasMensualDTO(
        Integer totalAsistencias,
        BigDecimal promedioAsistencias,
        Integer sociosActivos,
        List<SocioDTO> sociosMasActivos,
        Integer maxAsistencias
) {
}
