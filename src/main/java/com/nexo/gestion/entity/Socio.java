package com.nexo.gestion.entity;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToMany;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

@Entity
public class Socio {
    @Id
    private String dni;
    private String nombre;
    private String telefono;
    private String email;
    private LocalDate fecha_nacimiento;
    private boolean activo;
    @OneToMany(mappedBy = "socio")
    @JsonManagedReference
    List<SocioMembresia> membresias = new ArrayList<>();

    public Socio(){}

    public Socio(String dni, String nombre){
        this.dni = dni;
        this.nombre = nombre;
    }

    public Socio(String dni, String nombre, String telefono, String email, LocalDate fecha_nacimiento){
        this.dni = dni;
        this.nombre = nombre;
        this.telefono = telefono;
        this.email = email;
        this.fecha_nacimiento = fecha_nacimiento;
        this.activo = true;
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

    public boolean isActivo() {
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

    public LocalDate getFecha_nacimiento() {
        return fecha_nacimiento;
    }

    public void setFecha_nacimiento(LocalDate fecha_nacimiento) {
        this.fecha_nacimiento = fecha_nacimiento;
    }
}
