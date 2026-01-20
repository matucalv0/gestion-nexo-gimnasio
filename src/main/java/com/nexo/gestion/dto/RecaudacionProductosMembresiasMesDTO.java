package com.nexo.gestion.dto;

import java.math.BigDecimal;

public record RecaudacionProductosMembresiasMesDTO(
        BigDecimal totalProductos,
        BigDecimal totalPlanes
) {
}
