package com.nexo.gestion.dto;

import com.nexo.gestion.entity.CategoriaGasto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record MovimientoFinancieroDTO(
        TipoMovimiento tipoMovimiento,
        BigDecimal monto,
        LocalDateTime fecha,
        Integer idReferencia,
        // Campos adicionales para gastos
        CategoriaGasto categoria,
        String proveedor
) {
    // Constructor simplificado para pagos (sin categoria/proveedor)
    public MovimientoFinancieroDTO(TipoMovimiento tipoMovimiento, BigDecimal monto, LocalDateTime fecha, Integer idReferencia) {
        this(tipoMovimiento, monto, fecha, idReferencia, null, null);
    }
}
