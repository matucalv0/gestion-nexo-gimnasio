package com.nexo.gestion.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Date;

@Entity
public class Empleado {
    @Id
    private String dni;
    private String nombre;
    private String telefono;
    private String email;
    private LocalDate fecha_inicio;
    private LocalDate fecha_nacimiento;
    private boolean activo;
    @ManyToOne
    @JoinColumn(name = "id_puesto")
    private Puesto puesto;

    public Empleado(){}

    public Empleado(String dni, String nombre){
        this.dni = dni;
        this.nombre = nombre;
    }

    public Empleado(String dni, String nombre, String telefono, String email, LocalDate fecha_nacimiento, Puesto puesto){
        this.dni = dni;
        this.nombre = nombre;
        this.telefono = telefono;
        this.email = email;
        this.fecha_nacimiento = fecha_nacimiento;
        this.puesto = puesto;
        this.activo = true;
    }

    public Empleado(String dni, String nombre, String telefono, String email, LocalDate fecha_nacimiento){
        this.dni = dni;
        this.nombre = nombre;
        this.telefono = telefono;
        this.email = email;
        this.fecha_nacimiento = fecha_nacimiento;
    }

    public String getDni() {
        return dni;
    }

    public void setDni(String dni) {
        this.dni = dni;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public String getTelefono() {
        return telefono;
    }

    public void setTelefono(String telefono) {
        this.telefono = telefono;
    }

    public boolean isActivo() {
        return activo;
    }

    public void setActivo(boolean activo) {
        this.activo = activo;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public LocalDate getFecha_inicio() {
        return fecha_inicio;
    }

    public void setFecha_inicio(LocalDate fecha_inicio) {
        this.fecha_inicio = fecha_inicio;
    }

    @Override
    public String toString() {
        return "Empleado{" +
                "dni='" + dni + '\'' +
                ", nombre='" + nombre + '\'' +
                ", puesto=" + puesto +
                '}';
    }

    public LocalDate getFecha_nacimiento() {
        return fecha_nacimiento;
    }

    public void setFecha_nacimiento(LocalDate fecha_nacimiento) {
        this.fecha_nacimiento = fecha_nacimiento;
    }

    public Puesto getPuesto() {
        return puesto;
    }

    public void setPuesto(Puesto puesto) {
        this.puesto = puesto;
    }
}
