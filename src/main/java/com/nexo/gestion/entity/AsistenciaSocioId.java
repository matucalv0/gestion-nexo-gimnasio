package com.nexo.gestion.entity;

import jakarta.persistence.Embeddable;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.Objects;

@Embeddable
public class AsistenciaSocioId implements Serializable {
    private String dniSocio;
    private LocalDateTime fecha_hora;

    public AsistenciaSocioId(){}

    public AsistenciaSocioId(String dni, LocalDateTime fecha_hora){
        this.dniSocio = dni;
        this.fecha_hora = fecha_hora;
    }

    public String getDniSocio() {
        return dniSocio;
    }

    public void setDniSocio(String dniSocio) {
        this.dniSocio = dniSocio;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof AsistenciaSocioId that)) return false;
        return Objects.equals(dniSocio, that.dniSocio) &&
                Objects.equals(fecha_hora, that.fecha_hora);
    }

    @Override
    public int hashCode() {
        return Objects.hash(dniSocio, fecha_hora);
    }

    public LocalDateTime getFecha_hora() {
        return fecha_hora;
    }

    public void setFecha_hora(LocalDateTime fecha_hora) {
        this.fecha_hora = fecha_hora;
    }

    @Override
    public String toString() {
        return "AsistenciaSocioId{" +
                "dniSocio='" + dniSocio + '\'' +
                ", fecha_hora=" + fecha_hora +
                '}';
    }
}
