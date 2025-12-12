package com.nexo.gestion.dto;

import jakarta.persistence.Column;

import java.math.BigDecimal;

public record ProductoDTO(
        Integer id_producto,
        String nombre,
        BigDecimal precio_sugerido,
        Integer stock,
        boolean activo
) {}

