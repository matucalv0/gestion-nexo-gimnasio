package com.nexo.gestion.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
public class Rutina {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id_rutina;
    private String descripcion;
    private String nombre;
    private LocalDate fecha;
    @ManyToOne
    @JoinColumn(name = "dni_empleado")
    @JsonBackReference
    private Empleado empleado;
    @ManyToOne
    @JoinColumn(name = "dni_socio")
    @JsonBackReference
    private Socio socio;
    @OneToMany(mappedBy = "rutina")
    @JsonManagedReference
    List<EjercicioRutina> ejercicios = new ArrayList<>();

    public Rutina(){}

    @Override
    public String toString() {
        return "Rutina{" +
                "empleado=" + empleado +
                ", fecha=" + fecha +
                ", nombre='" + nombre + '\'' +
                ", descripcion='" + descripcion + '\'' +
                ", id_rutina=" + id_rutina +
                '}';
    }

    public Rutina(String nombre, String descripcion, Empleado empleado){
        this.nombre = nombre;
        this.descripcion = descripcion;
        this.empleado = empleado;
    }

    public Rutina(String nombre, String descripcion, Empleado empleado, Socio socio){
        this.nombre = nombre;
        this.descripcion = descripcion;
        this.empleado = empleado;
        this.socio = socio;
    }

    public Integer getId_rutina() {
        return id_rutina;
    }

    public List<EjercicioRutina> getEjercicios() {
        return ejercicios;
    }

    public void agregarEjercicio(EjercicioRutina ejercicio) {
        this.ejercicios.add(ejercicio);
        ejercicio.setRutina(this);
    }

    public void setId_rutina(Integer id_rutina) {
        this.id_rutina = id_rutina;
    }

    public String getDescripcion() {
        return descripcion;
    }

    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public LocalDate getFecha() {
        return fecha;
    }

    public void setFecha(LocalDate fecha) {
        this.fecha = fecha;
    }

    public Empleado getEmpleado() {
        return empleado;
    }

    public void setEmpleado(Empleado empleado) {
        this.empleado = empleado;
    }

    public Socio getSocio() {
        return socio;
    }

    public void setSocio(Socio socio) {
        this.socio = socio;
    }
}
