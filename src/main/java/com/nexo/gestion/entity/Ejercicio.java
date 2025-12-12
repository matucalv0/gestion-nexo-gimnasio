package com.nexo.gestion.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import jakarta.persistence.criteria.CriteriaBuilder;

import java.util.ArrayList;
import java.util.List;

@Entity
public class Ejercicio {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id_ejercicio;
    private String nombre;
    private String video;
    private String descripcion;
    @ManyToOne
    @JoinColumn(name = "id_grupo")
    GrupoMuscular grupoMuscular;
    @OneToMany(mappedBy = "ejercicio")
    List<EjercicioRutina> rutinas = new ArrayList<>();

    public Ejercicio(){}

    public Ejercicio(String nombre, GrupoMuscular grupoMuscular){
        this.nombre = nombre;
        this.grupoMuscular = grupoMuscular;

    }

    @Override
    public String toString() {
        return "Ejercicio{" +
                "descripcion='" + descripcion + '\'' +
                ", video='" + video + '\'' +
                ", nombre='" + nombre + '\'' +
                ", id_ejercicio=" + id_ejercicio +
                '}';
    }

    public Ejercicio(String nombre, GrupoMuscular grupoMuscular, String video, String descripcion){
        this.nombre = nombre;
        this.grupoMuscular = grupoMuscular;
        this.video = video;
        this.descripcion = descripcion;

    }

    public List<EjercicioRutina> getRutinas() {
        return rutinas;
    }

    public void agregarRutina(EjercicioRutina rutina) {
        this.rutinas.add(rutina);
        rutina.setEjercicio(this);
    }

    public Integer getId_ejercicio() {
        return id_ejercicio;
    }

    public void setId_ejercicio(Integer id_ejercicio) {
        this.id_ejercicio = id_ejercicio;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public String getVideo() {
        return video;
    }

    public void setVideo(String video) {
        this.video = video;
    }

    public String getDescripcion() {
        return descripcion;
    }

    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
    }

    public GrupoMuscular getGrupoMuscular() {
        return grupoMuscular;
    }

    public void setGrupoMuscular(GrupoMuscular grupoMuscular) {
        this.grupoMuscular = grupoMuscular;
    }
}
