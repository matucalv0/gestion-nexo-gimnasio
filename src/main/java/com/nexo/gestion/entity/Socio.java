package com.nexo.gestion.entity;

import jakarta.persistence.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
public class Socio {
    @Id
    private String dni;
    private String nombre;
    private String telefono;
    private String email;
    @Column(name = "fecha_nacimiento")
    private LocalDate fechaNacimiento;
    private boolean activo = false;

    @OneToMany(mappedBy = "socio")
    List<SocioMembresia> membresias = new ArrayList<>();

    public Socio(){}

    public Socio(String dni, String nombre){
        this.dni = dni;
        this.nombre = nombre;
    }

    public Socio(String dni, String nombre, String telefono, String email, LocalDate fechaNacimiento){
        this.dni = dni;
        this.nombre = nombre;
        this.telefono = telefono;
        this.email = email;
        this.fechaNacimiento = fechaNacimiento;
    }

    public String getDni() {
        return dni;
    }

    public List<SocioMembresia> getMembresias() {
        return membresias;
    }

    public void agregarMembresia(SocioMembresia membresia) {
        this.membresias.add(membresia);
        membresia.setSocio(this);
    }


    public Boolean isActivo() {
        return activo;
    }

    public void setActivo(boolean activo) {
        this.activo = activo;
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

    public String getEmail() {
        return email;
    }

    @Override
    public String toString() {
        return "Socio{" +
                "nombre='" + nombre + '\'' +
                ", dni='" + dni + '\'' +
                '}';
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public LocalDate getFechaNacimiento() {
        return fechaNacimiento;
    }

    public void setFechaNacimiento(LocalDate fechaNacimiento) {
        this.fechaNacimiento = fechaNacimiento;
    }
}
