package com.nexo.gestion.dto;

import java.math.BigDecimal;

public record PagoPorMesDTO(
        Integer anio,
        Integer mes,
        BigDecimal monto
) {
}
