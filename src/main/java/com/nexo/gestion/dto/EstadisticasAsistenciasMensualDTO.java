package com.nexo.gestion.dto;

import java.math.BigDecimal;
import java.util.List;

public record EstadisticasAsistenciasMensualDTO(
        Integer totalAsistencias,
        BigDecimal promedioAsistencias,
        Integer sociosActivos,
        List<SocioDTO> sociosMasActivos,
        Integer maxAsistencias,
        Double variacionAsistencias,
        Double variacionSocios,
        Double variacionPromedio
) {
    // Constructor de compatibilidad
    public EstadisticasAsistenciasMensualDTO(Integer totalAsistencias, BigDecimal promedioAsistencias, Integer sociosActivos, List<SocioDTO> sociosMasActivos, Integer maxAsistencias) {
        this(totalAsistencias, promedioAsistencias, sociosActivos, sociosMasActivos, maxAsistencias, 0.0, 0.0, 0.0);
    }
}
