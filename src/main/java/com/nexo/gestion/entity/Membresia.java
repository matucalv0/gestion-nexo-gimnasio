package com.nexo.gestion.entity;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Entity
public class Membresia {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)

    @Column(name = "id_membresia")
    private Integer idMembresia;

    @Column(name = "duracion_dias")
    private Integer duracionDias;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_membresia")
    private TipoMembresia tipoMembresia;

    @Column(name = "asistencias_por_semana")
    private Integer asistenciasPorSemana;

    @Column(precision = 10, scale = 2, name = "precio_sugerido")
    private BigDecimal precioSugerido;

    private String nombre;
    private boolean activo;

    //agregar constraint en la bd, nombre y tipoMembresia

    @OneToMany(mappedBy = "membresia")
    List<SocioMembresia> socios = new ArrayList<>();

    public Membresia(){}

    public Membresia(String nombre, Integer duracionDias, BigDecimal precioSugerido){
        this.nombre = nombre;
        this.duracionDias = duracionDias;
        this.precioSugerido = precioSugerido;
    }

    public Membresia(String nombre, Integer duracionDias, BigDecimal precioSugerido, Integer asistenciasPorSemana, TipoMembresia tipoMembresia){
        this.nombre = nombre;
        this.duracionDias = duracionDias;
        this.precioSugerido = precioSugerido;
        this.asistenciasPorSemana = asistenciasPorSemana;
        this.activo = true;
        this.tipoMembresia = tipoMembresia;
    }

    public TipoMembresia getTipoMembresia() {
        return tipoMembresia;
    }

    public void setTipoMembresia(TipoMembresia tipoMembresia) {
        this.tipoMembresia = tipoMembresia;
    }

    public Integer getIdMembresia() {
        return idMembresia;
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

    public Integer getAsistenciasPorSemana() {
        return asistenciasPorSemana;
    }

    public void setAsistenciasPorSemana(Integer asistenciasPorSemana) {
        this.asistenciasPorSemana = asistenciasPorSemana;
    }

    public void agregarSocio(SocioMembresia socio) {
        this.socios.add(socio);
        socio.setMembresia(this);
    }

    public void setIdMembresia(Integer idMembresia) {
        this.idMembresia = idMembresia;
    }

    public Integer getDuracionDias() {
        return duracionDias;
    }

    public void setDuracionDias(Integer duracionDias) {
        this.duracionDias = duracionDias;
    }

    public BigDecimal getPrecioSugerido() {
        return precioSugerido;
    }

    @Override
    public String toString() {
        return "Membresia{" +
                "nombre='" + nombre + '\'' +
                '}';
    }

    public void setPrecioSugerido(BigDecimal precioSugerido) {
        this.precioSugerido = precioSugerido;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }
}
