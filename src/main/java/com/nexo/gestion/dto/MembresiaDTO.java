package com.nexo.gestion.dto;


import java.math.BigDecimal;

public record MembresiaDTO(
        Integer id_membresia,
        Integer duracion_dias,
        BigDecimal precio_sugerido,
        String nombre
) {}
