package com.nexo.gestion.dto;

import java.math.BigDecimal;

public record BalancePorMesDTO(
        Integer anio,
        Integer mes,
        BigDecimal ingresos,
        BigDecimal egresos
) {
}
