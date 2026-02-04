package com.nexo.gestion.dto;

import java.math.BigDecimal;

public class FinanzaMesStatsDTO {
    private BigDecimal gananciaMes;
    private Double variacionMensual;

    public FinanzaMesStatsDTO() {}

    public FinanzaMesStatsDTO(BigDecimal gananciaMes, Double variacionMensual) {
        this.gananciaMes = gananciaMes;
        this.variacionMensual = variacionMensual;
    }

    public BigDecimal getGananciaMes() {
        return gananciaMes;
    }

    public void setGananciaMes(BigDecimal gananciaMes) {
        this.gananciaMes = gananciaMes;
    }

    public Double getVariacionMensual() {
        return variacionMensual;
    }

    public void setVariacionMensual(Double variacionMensual) {
        this.variacionMensual = variacionMensual;
    }
}
