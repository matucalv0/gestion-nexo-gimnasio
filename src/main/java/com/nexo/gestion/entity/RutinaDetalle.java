package com.nexo.gestion.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;

@Entity
@Table(name = "rutina_detalle")
public class RutinaDetalle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_detalle")
    private Long idDetalle;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_rutina", nullable = false)
    @JsonBackReference
    private Rutina rutina;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_ejercicio", nullable = false)
    private Ejercicio ejercicio;

    private Integer orden;
    
    @Column(length = 50)
    private String series;
    
    @Column(length = 50)
    private String repeticiones;
    
    @Column(length = 50)
    private String carga;
    
    @Column(length = 50)
    private String descanso;
    
    @Column(columnDefinition = "TEXT")
    private String observacion;

    @Column(name = "dia", nullable = false, columnDefinition = "int default 1")
    private Integer dia = 1;

    public RutinaDetalle() {}

    public RutinaDetalle(Rutina rutina, Ejercicio ejercicio, Integer orden, String series, String repeticiones, String carga, String descanso, String observacion) {
        this(rutina, ejercicio, orden, series, repeticiones, carga, descanso, observacion, 1);
    }

    public RutinaDetalle(Rutina rutina, Ejercicio ejercicio, Integer orden, String series, String repeticiones, String carga, String descanso, String observacion, Integer dia) {
        this.rutina = rutina;
        this.ejercicio = ejercicio;
        this.orden = orden;
        this.series = series;
        this.repeticiones = repeticiones;
        this.carga = carga;
        this.descanso = descanso;
        this.observacion = observacion;
        this.dia = dia != null ? dia : 1;
    }

    // Getters and Setters
    public Long getIdDetalle() {
        return idDetalle;
    }

    public void setIdDetalle(Long idDetalle) {
        this.idDetalle = idDetalle;
    }

    public Rutina getRutina() {
        return rutina;
    }

    public void setRutina(Rutina rutina) {
        this.rutina = rutina;
    }

    public Ejercicio getEjercicio() {
        return ejercicio;
    }

    public void setEjercicio(Ejercicio ejercicio) {
        this.ejercicio = ejercicio;
    }

    public Integer getOrden() {
        return orden;
    }

    public void setOrden(Integer orden) {
        this.orden = orden;
    }

    public String getSeries() {
        return series;
    }

    public void setSeries(String series) {
        this.series = series;
    }

    public String getRepeticiones() {
        return repeticiones;
    }

    public void setRepeticiones(String repeticiones) {
        this.repeticiones = repeticiones;
    }

    public String getCarga() {
        return carga;
    }

    public void setCarga(String carga) {
        this.carga = carga;
    }

    public String getDescanso() {
        return descanso;
    }

    public void setDescanso(String descanso) {
        this.descanso = descanso;
    }

    public String getObservacion() {
        return observacion;
    }

    public void setObservacion(String observacion) {
        this.observacion = observacion;
    }

    public Integer getDia() {
        return dia;
    }

    public void setDia(Integer dia) {
        this.dia = dia;
    }
}
