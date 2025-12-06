package com.nexo.gestion.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;

@Entity
public class MedioPago {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id_medioPago;
    private String nombre;

    public MedioPago(){}

    public MedioPago(String nombre){
        this.nombre = nombre;
    }

    public Integer getId_medioPago() {
        return id_medioPago;
    }

    public void setId_medioPago(Integer id_medioPago) {
        this.id_medioPago = id_medioPago;
    }

    public String getNombre() {
        return nombre;
    }

    @Override
    public String toString() {
        return "MedioPago{" +
                "nombre='" + nombre + '\'' +
                '}';
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }
}
