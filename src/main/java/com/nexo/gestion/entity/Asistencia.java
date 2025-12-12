package com.nexo.gestion.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
public class Asistencia {
    @EmbeddedId
    private AsistenciaSocioId id_asistencia;

    @ManyToOne
    @MapsId("dniSocio")
    @JoinColumn(name = "dni")
    private Socio socio;

    public Asistencia(){}

    public Asistencia(Socio socio){
        this.socio = socio;
        this.id_asistencia = new AsistenciaSocioId(socio.getDni(), LocalDateTime.now());
    }

    public AsistenciaSocioId getId_asistencia() {
        return id_asistencia;
    }

    public void setId_asistencia(AsistenciaSocioId id_asistencia) {
        this.id_asistencia = id_asistencia;
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
                "id_asistencia=" + id_asistencia +
                ", socio=" + socio +
                '}';
    }
}
