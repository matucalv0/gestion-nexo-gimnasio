package com.nexo.gestion.entity;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Entity
public class Membresia {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id_membresia;
    private Integer duracion_dias;
    @Column(precision = 10, scale = 2)
    private BigDecimal precio_sugerido;
    private String nombre;
    private boolean activo;
    @OneToMany(mappedBy = "membresia")
    List<SocioMembresia> socios = new ArrayList<>();

    public Membresia(){}

    public Membresia(String nombre, Integer duracion_dias, BigDecimal precio_sugerido){
        this.nombre = nombre;
        this.duracion_dias = duracion_dias;
        this.precio_sugerido = precio_sugerido;
        this.activo = true;
    }

    public Integer getId_membresia() {
        return id_membresia;
    }

    public boolean isActivo() {
        return activo;
    }

    public void setActivo(boolean activo) {
        this.activo = activo;
    }

    public List<SocioMembresia> getSocios() {
        return socios;
    }

    public void agregarSocio(SocioMembresia socio) {
        this.socios.add(socio);
        socio.setMembresia(this);
    }

    public void setId_membresia(Integer id_membresia) {
        this.id_membresia = id_membresia;
    }

    public Integer getDuracion_dias() {
        return duracion_dias;
    }

    public void setDuracion_dias(Integer duracion_dias) {
        this.duracion_dias = duracion_dias;
    }

    public BigDecimal getPrecio_sugerido() {
        return precio_sugerido;
    }

    @Override
    public String toString() {
        return "Membresia{" +
                "nombre='" + nombre + '\'' +
                '}';
    }

    public void setPrecio_sugerido(BigDecimal precio_sugerido) {
        this.precio_sugerido = precio_sugerido;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }
}
