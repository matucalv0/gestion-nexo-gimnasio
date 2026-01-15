package com.nexo.gestion.entity;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
public class SocioMembresia {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_sm")
    private Integer idSm;
    @Column(name = "fecha_inicio")
    private LocalDate fechaInicio;
    @Column(name = "fecha_hasta")
    private LocalDate fechaHasta;
    private boolean activo;
    @Column(precision = 10, scale = 2)
    private BigDecimal precio;

    @ManyToOne
    @JoinColumn(name = "dni_socio")
    private Socio socio;

    @ManyToOne
    @JoinColumn(name = "id_membresia")
    private Membresia membresia;

    public SocioMembresia(){}

    public SocioMembresia(BigDecimal precio, Socio socio, Membresia membresia){
        this.precio = precio;
        this.socio = socio;
        this.membresia = membresia;
        this.activo = true;
    }


    public SocioMembresia(Socio socio, Membresia membresia, LocalDate inicio, LocalDate vencimiento) {
        this.precio = membresia.getPrecioSugerido();
        this.socio = socio;
        this.membresia = membresia;
        this.fechaInicio = inicio;
        this.fechaHasta = vencimiento;
        this.activo = true;
    }

    public SocioMembresia(Socio socio, Membresia membresia){
        this.precio = membresia.getPrecioSugerido();
        this.socio = socio;
        this.membresia = membresia;
        this.fechaInicio = LocalDate.now();
        this.fechaHasta = fechaInicio.plusDays(membresia.getDuracionDias());
        this.activo = true;
    }

    public boolean isActivo() {
        return activo;
    }

    public void setActivo(boolean activo) {
        this.activo = activo;
    }


    public boolean cubre(LocalDate fecha) {
        if (fecha == null || fechaInicio == null || fechaHasta == null) {
            return false;
        }

        return (fecha.isEqual(fechaInicio) || fecha.isAfter(fechaInicio)) && (fecha.isEqual(fechaHasta) || fecha.isBefore(fechaHasta));
    }


    public Integer getIdSm() {
        return idSm;
    }

    public void setIdSm(Integer idSm) {
        this.idSm = idSm;
    }

    public LocalDate getFechaInicio() {
        return fechaInicio;
    }

    @Override
    public String toString() {
        return "SocioMembresia{" +
                "idSm=" + idSm +
                ", fechaInicio=" + fechaInicio +
                ", fechaHasta=" + fechaHasta +
                ", precio=" + precio +
                ", socio=" + socio +
                ", membresia=" + membresia +
                '}';
    }

    public void setFechaInicio(LocalDate fechaInicio) {
        this.fechaInicio = fechaInicio;
    }

    public LocalDate getFechaHasta() {
        return fechaHasta;
    }

    public void setFechaHasta(LocalDate fechaHasta) {
        this.fechaHasta = fechaHasta;
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
