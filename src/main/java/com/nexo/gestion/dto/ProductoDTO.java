package com.nexo.gestion.dto;

import java.math.BigDecimal;

public record ProductoDTO(
        Integer idProducto,
        String nombre,
        BigDecimal precioSugerido,
        Integer stock,
        boolean activo
) {}

