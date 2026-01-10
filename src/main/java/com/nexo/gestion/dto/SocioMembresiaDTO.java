package com.nexo.gestion.dto;


import java.math.BigDecimal;
import java.time.LocalDate;

public record SocioMembresiaDTO(
        Integer idSm,
        LocalDate fechaInicio,
        LocalDate fechaHasta,
        BigDecimal precio
) {}
