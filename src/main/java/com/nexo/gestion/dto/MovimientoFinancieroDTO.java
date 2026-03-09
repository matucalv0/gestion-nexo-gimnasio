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
        String proveedor,
        String dniSocio,
        String nombreSocio
) {
    // Constructor simplificado para pagos (sin categoria/proveedor)
    public MovimientoFinancieroDTO(TipoMovimiento tipoMovimiento, BigDecimal monto, LocalDateTime fecha, Integer idReferencia, String dniSocio, String nombreSocio) {
        this(tipoMovimiento, monto, fecha, idReferencia, null, null, dniSocio, nombreSocio);
    }
    
    // Constructor completo original para gastos 
    public MovimientoFinancieroDTO(TipoMovimiento tipoMovimiento, BigDecimal monto, LocalDateTime fecha, Integer idReferencia, CategoriaGasto categoria, String proveedor) {
        this(tipoMovimiento, monto, fecha, idReferencia, categoria, proveedor, null, null);
    }

    public MovimientoFinancieroDTO(TipoMovimiento tipoMovimiento, BigDecimal monto, LocalDateTime fecha, Integer idReferencia) {
        this(tipoMovimiento, monto, fecha, idReferencia, null, null, null, null);
    }
}
