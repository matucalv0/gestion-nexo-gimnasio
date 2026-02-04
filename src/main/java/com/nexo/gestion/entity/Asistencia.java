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

    @Enumerated(EnumType.STRING)
    @Column(name = "estado_asistencia")
    private EstadoAsistencia estadoAsistencia;

    public Asistencia(){}

    public Asistencia(Socio socio, boolean valida){
        this.socio = socio;
        this.idAsistencia = new AsistenciaSocioId(socio.getDni(), LocalDateTime.now());
        if (valida){
            estadoAsistencia = EstadoAsistencia.VALIDA;
        } else {
            estadoAsistencia = EstadoAsistencia.PENDIENTE;
        }
    }

    public EstadoAsistencia getEstadoAsistencia() {
        return estadoAsistencia;
    }

    public void setEstadoAsistencia(EstadoAsistencia estadoAsistencia) {
        this.estadoAsistencia = estadoAsistencia;
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
