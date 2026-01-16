package com.nexo.gestion.entity;

import jakarta.persistence.*;

import java.math.BigDecimal;

@Entity
public class Producto {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_producto")
    private Integer idProducto;
    private String nombre;
    @Column(precision = 10, scale = 2, name = "precio_sugerido")
    private BigDecimal precioSugerido;
    private Integer stock;
    private boolean activo;

    public Producto(){}

    public Producto(String nombre, BigDecimal precioSugerido, Integer stock){
        this.nombre = nombre;
        this.precioSugerido = precioSugerido;
        this.stock = stock;
        this.activo = true;
    }

    public void restarStock(Integer cantidad){
        this.stock -= cantidad;
    }

    public Integer getIdProducto() {
        return idProducto;
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

    public void setIdProducto(Integer idProducto) {
        this.idProducto = idProducto;
    }
}
