package com.nexo.gestion.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record BalancePorFechaDTO(
        LocalDate fecha,
        BigDecimal ingresos,
        BigDecimal egresos
) {
}
