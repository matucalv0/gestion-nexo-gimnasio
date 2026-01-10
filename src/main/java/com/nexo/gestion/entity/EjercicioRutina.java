package com.nexo.gestion.entity;

import jakarta.persistence.*;

@Entity
public class EjercicioRutina {
    @EmbeddedId
    private EjercicioRutinaId idEjercicioRutina;

    @ManyToOne
    @MapsId("idEjercicio")
    @JoinColumn(name = "id_ejercicio")
    private Ejercicio ejercicio;

    @ManyToOne
    @MapsId("idRutina")
    @JoinColumn(name = "id_rutina")

    private Rutina rutina;


    public EjercicioRutina(){}

    public EjercicioRutina(Ejercicio ejercicio, Rutina rutina){
        this.idEjercicioRutina = new EjercicioRutinaId(ejercicio.getIdEjercicio(), rutina.getIdRutina());
        this.rutina = rutina;
        this.ejercicio = ejercicio;
    }

    public EjercicioRutinaId getIdEjercicioRutina() {
        return idEjercicioRutina;
    }

    public void setIdEjercicioRutina(EjercicioRutinaId idEjercicioRutina) {
        this.idEjercicioRutina = idEjercicioRutina;
    }

    public Ejercicio getEjercicio() {
        return ejercicio;
    }

    public void setEjercicio(Ejercicio ejercicio) {
        this.ejercicio = ejercicio;
    }

    @Override
    public String toString() {
        return "EjercicioRutina{" +
                "id_ejercicioRutina=" + idEjercicioRutina +
                ", ejercicio=" + ejercicio +
                ", rutina=" + rutina +
                '}';
    }

    public Rutina getRutina() {
        return rutina;
    }

    public void setRutina(Rutina rutina) {
        this.rutina = rutina;
    }
}
