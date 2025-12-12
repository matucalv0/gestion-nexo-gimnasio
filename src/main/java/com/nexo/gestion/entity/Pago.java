package com.nexo.gestion.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

@Entity
public class Pago {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id_pago;
    @Enumerated(EnumType.STRING)
    private EstadoPago estado;
    private LocalDate fecha;
    @Column(precision = 10, scale = 2)
    private BigDecimal monto;
    @ManyToOne
    @JoinColumn(name = "dni_empleado")

    private Empleado empleado;
    @ManyToOne
    @JoinColumn(name = "dni_socio")

    private Socio socio;
    @ManyToOne
    @JoinColumn(name = "id_mediopago")

    private MedioPago medioPago;
    @OneToMany(mappedBy = "pago", cascade = CascadeType.ALL, orphanRemoval = true)

    List<DetallePago> detalles = new ArrayList<>();

    public Pago(){}

    public Pago(EstadoPago estado, BigDecimal monto, Socio socio, MedioPago medioPago, Empleado empleado){  //pago a socio
        this.estado = estado;
        this.monto = monto;
        this.socio = socio;
        this.medioPago = medioPago;
        this.empleado = empleado;
        this.fecha = LocalDate.now();
    }

    public List<DetallePago> getDetalles() {
        return detalles;
    }

    public void agregarDetalle(DetallePago detalle) {
        this.detalles.add(detalle);
    }

    public Pago(EstadoPago estado, Socio socio, MedioPago medioPago, Empleado empleado){  //pago a socio sin indicar monto
        this.estado = estado;
        this.socio = socio;
        this.medioPago = medioPago;
        this.empleado = empleado;
        this.fecha = LocalDate.now();
    }

    public Pago(EstadoPago estado, BigDecimal monto, MedioPago medioPago, Empleado empleado){ //pago a consumidor final
        this.estado = estado;
        this.monto = monto;
        this.medioPago = medioPago;
        this.empleado = empleado;
        this.fecha = LocalDate.now();
    }

    public Integer getId_pago() {
        return id_pago;
    }

    public void setId_pago(Integer id_pago) {
        this.id_pago = id_pago;
    }

    public EstadoPago getEstado() {
        return estado;
    }

    public void setEstado(EstadoPago estado) {
        this.estado = estado;
    }

    public LocalDate getFecha() {
        return fecha;
    }

    public void setFecha(LocalDate fecha) {
        this.fecha = fecha;
    }

    public BigDecimal getMonto() {
        return monto;
    }

    public void setMonto(BigDecimal monto) {
        this.monto = monto;
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

    public MedioPago getMedioPago() {
        return medioPago;
    }

    @Override
    public String toString() {
        return "Pago{" +
                "id_pago=" + id_pago +
                ", estado=" + estado +
                ", fecha=" + fecha +
                ", monto=" + monto +
                '}';
    }

    public String toStringConDetalles(){
        return "Pago{" +
                "id_pago=" + id_pago +
                ", estado=" + estado +
                ", fecha=" + fecha +
                ", monto=" + monto +
                ", detalles=" + detalles +
                '}';
    }

    public void setMedioPago(MedioPago medioPago) {
        this.medioPago = medioPago;
    }
}
