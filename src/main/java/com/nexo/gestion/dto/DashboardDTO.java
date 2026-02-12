package com.nexo.gestion.dto;

import java.math.BigDecimal;
import java.util.List;

public record DashboardDTO(
    BigDecimal recaudacionHoy,
    Integer sociosActivos,
    Integer sociosPorVencer,
    Integer asistenciasHoy,
    List<SocioPorVencerDTO> listaPorVencer
) {}

