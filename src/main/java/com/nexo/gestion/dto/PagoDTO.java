package com.nexo.gestion.dto;

import com.nexo.gestion.entity.EstadoPago;
import jakarta.persistence.Column;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;

import java.math.BigDecimal;
import java.time.LocalDate;

public record PagoDTO(
        Integer id_pago,
        EstadoPago estado,
        LocalDate fecha,
        BigDecimal monto
) {
}
