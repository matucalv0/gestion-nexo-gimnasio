package com.nexo.gestion.entity;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
public class Gasto {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_gasto")
    private Integer idGasto;
    @Column(name = "fecha")
    private LocalDateTime fecha;
    @Column(name = "monto", precision = 10, scale = 2)
    private BigDecimal monto;
    @Column(name = "categoria")
    @Enumerated(EnumType.STRING)
    private CategoriaGasto categoria;
    @Column(name = "proveedor")
    private String proveedor;
    private boolean activo = true;

    @ManyToOne
    @JoinColumn(name = "id_mediopago")
    private MedioPago medioPago;

    public Gasto(){}

    public Gasto(BigDecimal monto, CategoriaGasto categoria, String proveedor, MedioPago medioPago) {
        this.monto = monto;
        this.categoria = categoria;
        this.proveedor = proveedor;
        this.medioPago = medioPago;
        this.fecha = LocalDateTime.now();
        this.activo = true;
    }

    public Integer getIdGasto() {
        return idGasto;
    }

    public void setIdGasto(Integer idGasto) {
        this.idGasto = idGasto;
    }

    public LocalDateTime getFecha() {
        return fecha;
    }

    public void setFecha(LocalDateTime fecha) {
        this.fecha = fecha;
    }

    public BigDecimal getMonto() {
        return monto;
    }

    public void setMonto(BigDecimal monto) {
        this.monto = monto;
    }

    public CategoriaGasto getCategoria() {
        return categoria;
    }

    public void setCategoria(CategoriaGasto categoria) {
        this.categoria = categoria;
    }

    public String getProveedor() {
        return proveedor;
    }

    public void setProveedor(String proveedor) {
        this.proveedor = proveedor;
    }

    public MedioPago getMedioPago() {
        return medioPago;
    }

    public void setMedioPago(MedioPago medioPago) {
        this.medioPago = medioPago;
    }

    public boolean isActivo() {
        return activo;
    }

    public void setActivo(boolean activo) {
        this.activo = activo;
    }
}
