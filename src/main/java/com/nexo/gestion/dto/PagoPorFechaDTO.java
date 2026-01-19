package com.nexo.gestion.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record PagoPorFechaDTO(
        LocalDate fecha,
        BigDecimal monto
) {
}
