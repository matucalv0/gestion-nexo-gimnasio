package com.nexo.gestion.entity;

import jakarta.persistence.*;

@Entity
public class MedioPago {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_mediopago")
    private Integer idMedioPago;

    private String nombre;

    public MedioPago(){}

    public MedioPago(String nombre){
        this.nombre = nombre;
    }

    public Integer getIdMedioPago() {
        return idMedioPago;
    }

    public void setIdMedioPago(Integer idMedioPago) {
        this.idMedioPago = idMedioPago;
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
