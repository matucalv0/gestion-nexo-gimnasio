package com.nexo.gestion.entity;

import jakarta.persistence.Embeddable;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.Objects;

@Embeddable
public class AsistenciaSocioId implements Serializable {
    private String dniSocio;
    private LocalDateTime fechaHora;

    public AsistenciaSocioId(){}

    public AsistenciaSocioId(String dni, LocalDateTime fechaHora){
        this.dniSocio = dni;
        this.fechaHora = fechaHora;
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
                Objects.equals(fechaHora, that.fechaHora);
    }

    @Override
    public int hashCode() {
        return Objects.hash(dniSocio, fechaHora);
    }

    public LocalDateTime getFechaHora() {
        return fechaHora;
    }

    public void setFechaHora(LocalDateTime fechaHora) {
        this.fechaHora = fechaHora;
    }

    @Override
    public String toString() {
        return "AsistenciaSocioId{" +
                "dniSocio='" + dniSocio + '\'' +
                ", fechaHora=" + fechaHora +
                '}';
    }
}
