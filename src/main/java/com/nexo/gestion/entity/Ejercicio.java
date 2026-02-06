package com.nexo.gestion.entity;

import jakarta.persistence.*;

import java.util.ArrayList;
import java.util.List;

@Entity
public class Ejercicio {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_ejercicio")
    private Integer idEjercicio;

    private String nombre;
    @Column(name = "video_url")
    private String videoUrl;
    private String descripcion;
    @ManyToOne
    @JoinColumn(name = "id_grupo")
    GrupoMuscular grupoMuscular;
    @OneToMany(mappedBy = "ejercicio")
    List<RutinaDetalle> detalles = new ArrayList<>();

    public Ejercicio(){}

    public Ejercicio(String nombre, GrupoMuscular grupoMuscular){
        this.nombre = nombre;
        this.grupoMuscular = grupoMuscular;

    }

    @Override
    public String toString() {
        return "Ejercicio{" +
                "descripcion='" + descripcion + '\'' +
                ", video='" + videoUrl + '\'' +
                ", nombre='" + nombre + '\'' +
                ", id_ejercicio=" + idEjercicio +
                '}';
    }

    public Ejercicio(String nombre, GrupoMuscular grupoMuscular, String video, String descripcion){
        this.nombre = nombre;
        this.grupoMuscular = grupoMuscular;
        this.videoUrl = video;
        this.descripcion = descripcion;

    }

    public List<RutinaDetalle> getDetalles() {
        return detalles;
    }

    public void agregarDetalle(RutinaDetalle detalle) {
        this.detalles.add(detalle);
        detalle.setEjercicio(this);
    }

    public Integer getIdEjercicio() {
        return idEjercicio;
    }

    public void setIdEjercicio(Integer idEjercicio) {
        this.idEjercicio = idEjercicio;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public String getVideo() {
        return videoUrl;
    }

    public void setVideo(String video) {
        this.videoUrl = video;
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
