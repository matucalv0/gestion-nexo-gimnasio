package com.nexo.gestion.dto;

import java.math.BigDecimal;

public record DetallePagoDTO(
        String tipo,
        String nombre,
        Integer cantidad,
        BigDecimal precioUnitario,
        Integer idProducto,
        Integer idMembresia
) {
}
