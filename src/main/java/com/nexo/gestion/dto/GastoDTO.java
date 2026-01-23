package com.nexo.gestion.dto;

import com.nexo.gestion.entity.CategoriaGasto;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record GastoDTO(
        @NotNull
        LocalDateTime fecha,
        @NotNull
        BigDecimal monto,
        @NotNull
        CategoriaGasto categoria,
        @NotBlank
        String proveedor,
        @NotNull
        Integer idMedioPago
) {


}
