package com.nexo.gestion.dto;

import com.nexo.gestion.entity.EstadoPago;
import jakarta.persistence.Column;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.validation.constraints.NotBlank;

import java.math.BigDecimal;
import java.time.LocalDate;

public record PagoDTO(
        Integer id_pago,
        @NotBlank
        EstadoPago estado,
        @NotBlank
        LocalDate fecha,
        BigDecimal monto
) {
}
