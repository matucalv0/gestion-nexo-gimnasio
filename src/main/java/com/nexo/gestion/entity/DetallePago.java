package com.nexo.gestion.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;

import java.math.BigDecimal;

@Entity
public class DetallePago {
    @EmbeddedId
    private DetallePagoId id_detallepago;
    @ManyToOne
    @MapsId("idPago")
    @JoinColumn(name = "id_pago")
    @JsonBackReference
    private Pago pago;
    private Integer cantidad;
    @Column(precision = 10, scale = 2)
    private BigDecimal precio_unitario;
    @Column(precision = 10, scale = 2)
    private BigDecimal subtotal;
    @ManyToOne
    @JoinColumn(name = "id_producto")
    @JsonBackReference
    private Producto producto;
    @ManyToOne
    @JoinColumn(name = "socio_membresia")
    @JsonBackReference
    private SocioMembresia socioMembresia;


    public DetallePago(){}

    public DetallePago(Integer numeroDetalle, Producto producto, Pago pago, Integer cantidad, BigDecimal precio_unitario){
        this.producto = producto;
        this.pago = pago;
        this.cantidad = cantidad;
        this.precio_unitario = precio_unitario;
        this.id_detallepago = new DetallePagoId(pago.getId_pago(), numeroDetalle);
    }

    public DetallePago(Integer numeroDetalle, SocioMembresia socioMembresia, Pago pago, BigDecimal precio_unitario){
        this.socioMembresia = socioMembresia;
        this.pago = pago;
        this.precio_unitario = precio_unitario;
        this.id_detallepago = new DetallePagoId(pago.getId_pago(), numeroDetalle);
    }

    @PrePersist
    public void calcularSubtotal(){
        if (cantidad == null){
            cantidad = 1;
        }
        subtotal = precio_unitario.multiply(BigDecimal.valueOf(cantidad));
    }


    public DetallePagoId getId_detallepago() {
        return id_detallepago;
    }

    public void setId_detallepago(DetallePagoId id_detallepago) {
        this.id_detallepago = id_detallepago;
    }

    public Pago getPago() {
        return pago;
    }

    public void setPago(Pago pago) {
        this.pago = pago;
    }

    public Integer getCantidad() {
        return cantidad;
    }

    @Override
    public String toString() {
        return "DetallePago{" +
                "id_detallepago=" + id_detallepago +
                ", cantidad=" + cantidad +
                ", precio_unitario=" + precio_unitario +
                ", subtotal=" + subtotal +
                '}';
    }

    public void setCantidad(Integer cantidad) {
        this.cantidad = cantidad;
    }

    public BigDecimal getPrecio_unitario() {
        return precio_unitario;
    }

    public void setPrecio_unitario(BigDecimal precio_unitario) {
        this.precio_unitario = precio_unitario;
    }

    public BigDecimal getSubtotal() {
        return subtotal;
    }

    public void setSubtotal(BigDecimal subtotal) {
        this.subtotal = subtotal;
    }

    public Producto getProducto() {
        return producto;
    }

    public void setProducto(Producto producto) {
        this.producto = producto;
    }

    public SocioMembresia getSocioMembresia() {
        return socioMembresia;
    }

    public void setSocioMembresia(SocioMembresia socioMembresia) {
        this.socioMembresia = socioMembresia;
    }
}
