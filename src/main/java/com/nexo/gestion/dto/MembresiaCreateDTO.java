package com.nexo.gestion.dto;

import jakarta.persistence.Column;

import java.math.BigDecimal;

public class MembresiaCreateDTO {
    private Integer id_membresia;
    private Integer duracion_dias;
    @Column(precision = 10, scale = 2)
    private BigDecimal precio_sugerido;
    private String nombre;

    public Integer getId_membresia() {
        return id_membresia;
    }

    public void setId_membresia(Integer id_membresia) {
        this.id_membresia = id_membresia;
    }

    public Integer getDuracion_dias() {
        return duracion_dias;
    }

    public void setDuracion_dias(Integer duracion_dias) {
        this.duracion_dias = duracion_dias;
    }

    public BigDecimal getPrecio_sugerido() {
        return precio_sugerido;
    }

    public void setPrecio_sugerido(BigDecimal precio_sugerido) {
        this.precio_sugerido = precio_sugerido;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }
}
