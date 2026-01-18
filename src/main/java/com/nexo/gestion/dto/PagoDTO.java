package com.nexo.gestion.dto;

import com.nexo.gestion.entity.DetallePago;
import com.nexo.gestion.entity.EstadoPago;
import jakarta.validation.constraints.NotBlank;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

public record PagoDTO(
        Integer idPago,
        @NotBlank
        EstadoPago estado,
        @NotBlank
        LocalDate fecha,
        BigDecimal monto,
        List<DetallePagoDTO> detalles
) {
}
