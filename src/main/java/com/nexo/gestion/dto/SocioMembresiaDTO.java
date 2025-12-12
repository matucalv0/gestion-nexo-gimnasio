package com.nexo.gestion.dto;


import java.math.BigDecimal;
import java.time.LocalDate;

public record SocioMembresiaDTO(
        Integer id_sm,
        LocalDate fecha_inicio,
        LocalDate fecha_hasta,
        BigDecimal precio
) {}
