package com.nexo.gestion.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;

@Entity
public class GrupoMuscular {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer ig_grupo;
    private String nombre;

    public GrupoMuscular(){}

    public GrupoMuscular(String nombre){
        this.nombre = nombre;
    }

    public Integer getIg_grupo() {
        return ig_grupo;
    }

    public void setIg_grupo(Integer ig_grupo) {
        this.ig_grupo = ig_grupo;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }
}
