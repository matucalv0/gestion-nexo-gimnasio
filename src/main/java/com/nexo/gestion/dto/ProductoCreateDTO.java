package com.nexo.gestion.dto;

import jakarta.persistence.Column;

import java.math.BigDecimal;

public class ProductoCreateDTO {
    private String nombre;
    @Column(precision = 10, scale = 2)
    private BigDecimal precioSugerido;
    private Integer stock;


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
}
