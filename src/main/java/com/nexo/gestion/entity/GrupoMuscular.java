package com.nexo.gestion.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;

@Entity
public class GrupoMuscular {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id_grupo;
    private String nombre;

    public GrupoMuscular(){}

    public GrupoMuscular(String nombre){
        this.nombre = nombre;
    }

    public Integer getId_grupo() {
        return id_grupo;
    }

    public void setId_grupo(Integer id_grupo) {
        this.id_grupo = id_grupo;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }
}
