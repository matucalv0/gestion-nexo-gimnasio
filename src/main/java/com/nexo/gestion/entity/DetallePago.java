package com.nexo.gestion.entity;

import jakarta.persistence.*;

import java.math.BigDecimal;

@Entity
public class DetallePago {
    @EmbeddedId
    private DetallePagoId idDetallePago;
    @ManyToOne
    @MapsId("idPago")
    @JoinColumn(name = "id_pago")
    private Pago pago;
    private Integer cantidad;
    @Column(precision = 10, scale = 2, name = "precio_unitario")
    private BigDecimal precioUnitario;
    @Column(precision = 10, scale = 2, insertable = false, updatable = false)
    private BigDecimal subtotal;
    @ManyToOne
    @JoinColumn(name = "id_producto")
    private Producto producto;
    @ManyToOne
    @JoinColumn(name = "id_sm")
    private SocioMembresia socioMembresia;


    public DetallePago(){}

    public DetallePago(Integer numeroDetalle, Producto producto, Pago pago, Integer cantidad, BigDecimal precioUnitario){
        this.producto = producto;
        this.pago = pago;
        this.cantidad = cantidad;
        this.precioUnitario = precioUnitario;
        this.idDetallePago = new DetallePagoId(pago.getIdPago(), numeroDetalle);
    }

    public DetallePago(Integer numeroDetalle, SocioMembresia socioMembresia, Pago pago, BigDecimal precioUnitario){
        this.socioMembresia = socioMembresia;
        this.pago = pago;
        this.precioUnitario = precioUnitario;
        this.idDetallePago = new DetallePagoId(pago.getIdPago(), numeroDetalle);
    }

    public boolean esMembresia(){
        return this.socioMembresia != null;
    }

    public boolean esProducto(){
        return this.producto != null;
    }



    public void calcularSubtotal(){
        if (cantidad == null){
            cantidad = 1;
        }
        subtotal = precioUnitario.multiply(BigDecimal.valueOf(cantidad));
    }


    public DetallePagoId getIdDetallePago() {
        return idDetallePago;
    }

    public void setIdDetallePago(DetallePagoId idDetallePago) {
        this.idDetallePago = idDetallePago;
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
                "id_detallepago=" + idDetallePago +
                ", cantidad=" + cantidad +
                ", precio_unitario=" + precioUnitario +
                ", subtotal=" + subtotal +
                '}';
    }

    public void setCantidad(Integer cantidad) {
        this.cantidad = cantidad;
    }

    public BigDecimal getPrecioUnitario() {
        return precioUnitario;
    }

    public void setPrecioUnitario(BigDecimal precioUnitario) {
        this.precioUnitario = precioUnitario;
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
