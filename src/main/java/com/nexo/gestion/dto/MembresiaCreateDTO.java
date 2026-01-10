package com.nexo.gestion.dto;

import jakarta.persistence.Column;

import java.math.BigDecimal;

public class MembresiaCreateDTO {
    private Integer duracionDias;
    @Column(precision = 10, scale = 2)
    private BigDecimal precioSugerido;
    private String nombre;
    private Integer asistenciasPorSemana;

    public MembresiaCreateDTO(){};

    public MembresiaCreateDTO(Integer duracionDias, BigDecimal precioSugerido, String nombre, Integer asistenciasPorSemana){
        this.duracionDias = duracionDias;
        this.precioSugerido = precioSugerido;
        this.nombre = nombre;
        this.asistenciasPorSemana = asistenciasPorSemana;
    }


    public Integer getDuracionDias() {
        return duracionDias;
    }

    public void setDuracionDias(Integer duracionDias) {
        this.duracionDias = duracionDias;
    }

    public Integer getAsistenciasPorSemana() {
        return asistenciasPorSemana;
    }

    public void setAsistenciasPorSemana(Integer asistenciasPorSemana) {
        this.asistenciasPorSemana = asistenciasPorSemana;
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

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }
}
