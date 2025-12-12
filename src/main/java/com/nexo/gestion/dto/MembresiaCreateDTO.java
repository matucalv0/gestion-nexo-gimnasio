package com.nexo.gestion.dto;

import jakarta.persistence.Column;

import java.math.BigDecimal;

public class MembresiaCreateDTO {
    private Integer duracion_dias;
    @Column(precision = 10, scale = 2)
    private BigDecimal precio_sugerido;
    private String nombre;

    public MembresiaCreateDTO(){};

    public MembresiaCreateDTO(Integer duracion_dias, BigDecimal precio_sugerido, String nombre){
        this.duracion_dias = duracion_dias;
        this.precio_sugerido = precio_sugerido;
        this.nombre = nombre;
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
