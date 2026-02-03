package com.nexo.gestion.dto;

import java.math.BigDecimal;

public record DistribucionFinanzasDTO(
        BigDecimal ingresos,
        BigDecimal gastos
) {
}
