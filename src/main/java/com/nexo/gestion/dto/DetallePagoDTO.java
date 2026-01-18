package com.nexo.gestion.dto;

import java.math.BigDecimal;

public record DetallePagoDTO(
        Integer cantidad,
        BigDecimal precioUnitario,
        Integer idProducto,
        Integer idMembresia
) {
}
