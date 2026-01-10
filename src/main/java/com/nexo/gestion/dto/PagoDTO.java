package com.nexo.gestion.dto;

import com.nexo.gestion.entity.EstadoPago;
import jakarta.validation.constraints.NotBlank;

import java.math.BigDecimal;
import java.time.LocalDate;

public record PagoDTO(
        Integer idPago,
        @NotBlank
        EstadoPago estado,
        @NotBlank
        LocalDate fecha,
        BigDecimal monto
) {
}
