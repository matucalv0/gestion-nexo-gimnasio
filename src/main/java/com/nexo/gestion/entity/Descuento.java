package com.nexo.gestion.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "descuento", schema = "public")
public class Descuento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_descuento")
    private Integer idDescuento;

    @Column(nullable = false, length = 50)
    private String nombre;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal porcentaje;

    @Column(nullable = false) // 'default true' in DB, but good to handle in code or let DB handle
    private Boolean activo = true;

    public Descuento() {
    }

    public Descuento(String nombre, BigDecimal porcentaje, Boolean activo) {
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

    @Override
    public String toString() {
        return "Descuento{" +
                "idDescuento=" + idDescuento +
                ", nombre='" + nombre + '\'' +
                ", porcentaje=" + porcentaje +
                ", activo=" + activo +
                '}';
    }
}
