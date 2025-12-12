package com.nexo.gestion.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import org.springframework.cglib.core.Local;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Date;

@Entity
public class SocioMembresia {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id_sm;
    private LocalDate fecha_inicio;
    private LocalDate fecha_hasta;
    @Column(precision = 10, scale = 2)
    private BigDecimal precio;
    @ManyToOne
    @JoinColumn(name = "dni_socio")
    @JsonBackReference
    @JsonIgnore
    private Socio socio;
    @ManyToOne
    @JoinColumn(name = "id_membresia")
    @JsonBackReference
    @JsonIgnore
    private Membresia membresia;

    public SocioMembresia(){}

    public SocioMembresia(BigDecimal precio, Socio socio, Membresia membresia){
        this.precio = precio;
        this.socio = socio;
        this.membresia = membresia;
    }

    public SocioMembresia(Socio socio, Membresia membresia){
        this.precio = membresia.getPrecio_sugerido();
        this.socio = socio;
        this.membresia = membresia;
    }

    @PrePersist
    @PreUpdate
    public void inicializarFechas() {
        if (this.fecha_inicio == null) {
            this.fecha_inicio = LocalDate.now();
        }


        this.fecha_hasta = this.fecha_inicio.plusDays(
                this.membresia.getDuracion_dias()
        );
    }

    public Integer getId_sm() {
        return id_sm;
    }

    public void setId_sm(Integer id_sm) {
        this.id_sm = id_sm;
    }

    public LocalDate getFecha_inicio() {
        return fecha_inicio;
    }

    @Override
    public String toString() {
        return "SocioMembresia{" +
                "id_sm=" + id_sm +
                ", fecha_inicio=" + fecha_inicio +
                ", fecha_hasta=" + fecha_hasta +
                ", precio=" + precio +
                ", socio=" + socio +
                ", membresia=" + membresia +
                '}';
    }

    public void setFecha_inicio(LocalDate fecha_inicio) {
        this.fecha_inicio = fecha_inicio;
    }

    public LocalDate getFecha_hasta() {
        return fecha_hasta;
    }

    public void setFecha_hasta(LocalDate fecha_hasta) {
        this.fecha_hasta = fecha_hasta;
    }

    public BigDecimal getPrecio() {
        return precio;
    }

    public void setPrecio(BigDecimal precio) {
        this.precio = precio;
    }

    public Socio getSocio() {
        return socio;
    }

    public void setSocio(Socio socio) {
        this.socio = socio;
    }

    public Membresia getMembresia() {
        return membresia;
    }

    public void setMembresia(Membresia membresia) {
        this.membresia = membresia;
    }
}
