package com.nexo.gestion.entity;

import jakarta.persistence.*;

import java.time.LocalDate;

@Entity
public class Empleado {
    @Id
    private String dni;
    private String nombre;
    private String telefono;
    private String email;

    @Column(name = "fecha_inicio")
    private LocalDate fechaInicio;

    @Column(name = "fecha_nacimiento")
    private LocalDate fechaNacimiento;

    private boolean activo;

    @ManyToOne
    @JoinColumn(name = "id_puesto")
    private Puesto puesto;

    public Empleado(){}

    public Empleado(String dni, String nombre){
        this.dni = dni;
        this.nombre = nombre;
    }

    public Empleado(String dni, String nombre, String telefono, String email, LocalDate fechaNacimiento, Puesto puesto){
        this.dni = dni;
        this.nombre = nombre;
        this.telefono = telefono;
        this.email = email;
        this.fechaNacimiento = fechaNacimiento;
        this.puesto = puesto;
        this.activo = true;
    }

    public Empleado(String dni, String nombre, String telefono, String email, LocalDate fechaNacimiento){
        this.dni = dni;
        this.nombre = nombre;
        this.telefono = telefono;
        this.email = email;
        this.fechaNacimiento = fechaNacimiento;
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

    public LocalDate getFechaInicio() {
        return fechaInicio;
    }

    public void setFechaInicio(LocalDate fechaInicio) {
        this.fechaInicio = fechaInicio;
    }

    @Override
    public String toString() {
        return "Empleado{" +
                "dni='" + dni + '\'' +
                ", nombre='" + nombre + '\'' +
                ", puesto=" + puesto +
                '}';
    }

    public LocalDate getFechaNacimiento() {
        return fechaNacimiento;
    }

    public void setFechaNacimiento(LocalDate fechaNacimiento) {
        this.fechaNacimiento = fechaNacimiento;
    }

    public Puesto getPuesto() {
        return puesto;
    }

    public void setPuesto(Puesto puesto) {
        this.puesto = puesto;
    }
}
