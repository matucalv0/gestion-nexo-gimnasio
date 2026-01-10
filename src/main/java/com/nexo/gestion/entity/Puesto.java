package com.nexo.gestion.entity;

import jakarta.persistence.*;

@Entity
public class Puesto {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_puesto")
    private Integer idPuesto;
    private String nombre;

    public Puesto(){}

    public Puesto(String nombre){
        this.nombre = nombre;
    }

    @Override
    public String toString() {
        return "Puesto{" +
                "nombre='" + nombre + '\'' +
                '}';
    }

    public Integer getIdPuesto() {
        return idPuesto;
    }

    public void setIdPuesto(Integer idPuesto) {
        this.idPuesto = idPuesto;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }
}
