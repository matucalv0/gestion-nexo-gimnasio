package com.nexo.gestion.entity;

import jakarta.persistence.*;

import java.math.BigDecimal;

@Entity
public class Producto {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id_producto;
    private String nombre;
    @Column(precision = 10, scale = 2)
    private BigDecimal precio_sugerido;
    private Integer stock;
    private boolean activo;

    public Producto(){}

    public Producto(String nombre, BigDecimal precio_sugerido, Integer stock){
        this.nombre = nombre;
        this.precio_sugerido = precio_sugerido;
        this.stock = stock;
        this.activo = true;
    }

    public Integer getId_producto() {
        return id_producto;
    }

    public boolean isActivo() {
        return activo;
    }

    public void setActivo(boolean activo) {
        this.activo = activo;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public BigDecimal getPrecio_sugerido() {
        return precio_sugerido;
    }

    public void setPrecio_sugerido(BigDecimal precio_sugerido) {
        this.precio_sugerido = precio_sugerido;
    }

    public Integer getStock() {
        return stock;
    }

    public void setStock(Integer stock) {
        this.stock = stock;
    }

    public void setId_producto(Integer id_producto) {
        this.id_producto = id_producto;
    }
}
