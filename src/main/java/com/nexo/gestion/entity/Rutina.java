package com.nexo.gestion.entity;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
public class Rutina {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_rutina")
    private Integer idRutina;
    private String descripcion;
    private String nombre;
    private LocalDate fecha;

    @ManyToOne
    @JoinColumn(name = "dni_empleado")
    private Empleado empleado;

    @ManyToOne
    @JoinColumn(name = "dni_socio")
    private Socio socio;

    @OneToMany(mappedBy = "rutina", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference
    private List<RutinaDetalle> detalles = new ArrayList<>();

    // ID de la plantilla de la cual fue copiada esta rutina (null si es plantilla)
    @Column(name = "id_plantilla_origen")
    private Integer idPlantillaOrigen;

    // Indica si la rutina asignada fue modificada respecto a su plantilla original
    @Column(name = "personalizada", nullable = false)
    private Boolean personalizada = false;

    public Rutina(){}

    @Override
    public String toString() {
        return "Rutina{" +
                "empleado=" + empleado +
                ", fecha=" + fecha +
                ", nombre='" + nombre + '\'' +
                ", descripcion='" + descripcion + '\'' +
                ", id_rutina=" + idRutina +
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
        this.fecha = LocalDate.now();
    }

    public Integer getIdRutina() {
        return idRutina;
    }

    public List<RutinaDetalle> getDetalles() {
        return detalles;
    }

    public void setDetalles(List<RutinaDetalle> detalles) {
        this.detalles.clear();
        if (detalles != null) {
            this.detalles.addAll(detalles);
        }
    }

    public void agregarDetalle(RutinaDetalle detalle) {
        this.detalles.add(detalle);
        detalle.setRutina(this);
    }

    public void setIdRutina(Integer idRutina) {
        this.idRutina = idRutina;
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

    public Integer getIdPlantillaOrigen() {
        return idPlantillaOrigen;
    }

    public void setIdPlantillaOrigen(Integer idPlantillaOrigen) {
        this.idPlantillaOrigen = idPlantillaOrigen;
    }

    public Boolean getPersonalizada() {
        return personalizada;
    }

    public void setPersonalizada(Boolean personalizada) {
        this.personalizada = personalizada;
    }
}
