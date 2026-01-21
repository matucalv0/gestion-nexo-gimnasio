package com.nexo.gestion.dto;

import com.nexo.gestion.entity.TipoMembresia;
import jakarta.persistence.Column;

import java.math.BigDecimal;

public class MembresiaPatchDTO {
    private Integer duracionDias;
    @Column(precision = 10, scale = 2)
    private BigDecimal precioSugerido;
    private String nombre;
    private Boolean activo;
    private TipoMembresia tipoMembresia;

    public Integer getDuracionDias() {
        return duracionDias;
    }

    public void setDuracionDias(Integer duracionDias) {
        this.duracionDias = duracionDias;
    }

    public BigDecimal getPrecioSugerido() {
        return precioSugerido;
    }

    public void setPrecioSugerido(BigDecimal precioSugerido) {
        this.precioSugerido = precioSugerido;
    }

    public String getNombre() {
        return nombre;
    }

    public TipoMembresia getTipoMembresia() {
        return tipoMembresia;
    }

    public void setTipoMembresia(TipoMembresia tipoMembresia) {
        this.tipoMembresia = tipoMembresia;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public Boolean getActivo() {
        return activo;
    }

    public void setActivo(Boolean activo) {
        this.activo = activo;
    }
}
