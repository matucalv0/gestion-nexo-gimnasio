package com.nexo.gestion.dto;

import java.math.BigDecimal;

public class PagoMesStatsDTO {
    private BigDecimal totalMes;
    private Double variacionMensual;

    // Constructores
    public PagoMesStatsDTO() {}
    
    public PagoMesStatsDTO(BigDecimal totalMes, Double variacionMensual) {
        this.totalMes = totalMes;
        this.variacionMensual = variacionMensual;
    }

    // Getters y Setters
    public BigDecimal getTotalMes() {
        return totalMes;
    }

    public void setTotalMes(BigDecimal totalMes) {
        this.totalMes = totalMes;
    }

    public Double getVariacionMensual() {
        return variacionMensual;
    }

    public void setVariacionMensual(Double variacionMensual) {
        this.variacionMensual = variacionMensual;
    }
}
