package com.nexo.gestion.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
public class Asistencia {
    @EmbeddedId
    private AsistenciaSocioId idAsistencia;

    @ManyToOne
    @MapsId("dniSocio")
    @JoinColumn(name = "dni")
    private Socio socio;

    public Asistencia(){}

    public Asistencia(Socio socio){
        this.socio = socio;
        this.idAsistencia = new AsistenciaSocioId(socio.getDni(), LocalDateTime.now());
    }

    public AsistenciaSocioId getIdAsistencia() {
        return idAsistencia;
    }

    public void setIdAsistencia(AsistenciaSocioId idAsistencia) {
        this.idAsistencia = idAsistencia;
    }

    public Socio getSocio() {
        return socio;
    }

    public void setSocio(Socio socio) {
        this.socio = socio;
    }

    @Override
    public String toString() {
        return "Asistencia{" +
                "id_asistencia=" + idAsistencia +
                ", socio=" + socio +
                '}';
    }
}
