package com.nexo.gestion.dto;

import jakarta.persistence.Column;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public class ProductoCreateDTO {
    @NotBlank(message = "Debe ingresar un nombre")
    private String nombre;
    @NotNull(message = "Debe ingresar un precio")
    @Column(precision = 10, scale = 2)
    private BigDecimal precioSugerido;
    @NotNull(message = "Debe ingresar una cantidad de stock inicial")
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
