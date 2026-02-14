package com.nexo.gestion.dto;

import java.math.BigDecimal;

public class DescuentoDTO {
    private Integer idDescuento;
    private String nombre;
    private BigDecimal porcentaje;
    private Boolean activo;

    public DescuentoDTO() {
    }

    public DescuentoDTO(Integer idDescuento, String nombre, BigDecimal porcentaje) {
        this.idDescuento = idDescuento;
        this.nombre = nombre;
        this.porcentaje = porcentaje;
        this.activo = true;
    }

    public DescuentoDTO(Integer idDescuento, String nombre, BigDecimal porcentaje, Boolean activo) {
        this.idDescuento = idDescuento;
        this.nombre = nombre;
        this.porcentaje = porcentaje;
        this.activo = activo;
    }

    public Integer getIdDescuento() {
        return idDescuento;
    }

    public void setIdDescuento(Integer idDescuento) {
        this.idDescuento = idDescuento;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public BigDecimal getPorcentaje() {
        return porcentaje;
    }

    public void setPorcentaje(BigDecimal porcentaje) {
        this.porcentaje = porcentaje;
    }

    public Boolean getActivo() {
        return activo;
    }

    public void setActivo(Boolean activo) {
        this.activo = activo;
    }
}
