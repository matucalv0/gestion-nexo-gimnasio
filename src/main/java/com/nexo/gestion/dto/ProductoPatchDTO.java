package com.nexo.gestion.dto;

import jakarta.persistence.Column;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public class ProductoPatchDTO {
    @NotBlank(message = "Debe ingresar un nombre")
    private String nombre;
    @Column(precision = 10, scale = 2)
    @NotNull(message = "Debe ingresar un precio")
    private BigDecimal precioSugerido;
    private Integer stock;
    private Boolean activo;

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public BigDecimal getPrecioSugerido() {
        return precioSugerido;
    }

    public void setPrecioSugerido(BigDecimal precioSugerido) {
        this.precioSugerido = precioSugerido;
    }

    public Integer getStock() {
        return stock;
    }

    public void setStock(Integer stock) {
        this.stock = stock;
    }

    public Boolean getActivo() {
        return activo;
    }

    public void setActivo(Boolean activo) {
        this.activo = activo;
    }
}
