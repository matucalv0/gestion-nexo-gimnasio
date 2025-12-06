package com.nexo.gestion.entity;

import jakarta.persistence.Embeddable;

import java.io.Serializable;
import java.util.Objects;

@Embeddable
public class EjercicioRutinaId implements Serializable {
    private Integer idEjercicio;
    private Integer idRutina;

    public EjercicioRutinaId(){}

    public EjercicioRutinaId(Integer idEjercicio, Integer idRutina){
        this.idEjercicio = idEjercicio;
        this.idRutina = idRutina;
    }

    @Override
    public String toString() {
        return "EjercicioRutinaId{" +
                "idEjercicio=" + idEjercicio +
                ", idRutina=" + idRutina +
                '}';
    }

    @Override
    public boolean equals(Object o) {
        if (!(o instanceof EjercicioRutinaId that)) return false;
        return Objects.equals(idEjercicio, that.idEjercicio) && Objects.equals(idRutina, that.idRutina);
    }

    @Override
    public int hashCode() {
        return Objects.hash(idEjercicio, idRutina);
    }

    public Integer getIdEjercicio() {
        return idEjercicio;
    }

    public void setIdEjercicio(Integer idEjercicio) {
        this.idEjercicio = idEjercicio;
    }

    public Integer getIdRutina() {
        return idRutina;
    }

    public void setIdRutina(Integer idRutina) {
        this.idRutina = idRutina;
    }
}
