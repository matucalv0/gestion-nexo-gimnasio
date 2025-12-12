package com.nexo.gestion.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

@Entity
public class EjercicioRutina {
    @EmbeddedId
    private EjercicioRutinaId id_ejercicioRutina;

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
        this.id_ejercicioRutina = new EjercicioRutinaId(ejercicio.getId_ejercicio(), rutina.getId_rutina());
        this.rutina = rutina;
        this.ejercicio = ejercicio;
    }

    public EjercicioRutinaId getId_ejercicioRutina() {
        return id_ejercicioRutina;
    }

    public void setId_ejercicioRutina(EjercicioRutinaId id_ejercicioRutina) {
        this.id_ejercicioRutina = id_ejercicioRutina;
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
                "id_ejercicioRutina=" + id_ejercicioRutina +
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
