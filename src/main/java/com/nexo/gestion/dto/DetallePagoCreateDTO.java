package com.nexo.gestion.dto;



import java.math.BigDecimal;

public class DetallePagoCreateDTO {
    private Integer cantidad;
    private BigDecimal precio_unitario;
    private Integer id_producto;
    private Integer id_sm;


    public Integer getCantidad() {
        return cantidad;
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


    public Integer getId_producto() {
        return id_producto;
    }

    public void setId_producto(Integer id_producto) {
        this.id_producto = id_producto;
    }

    public Integer getId_sm() {
        return id_sm;
    }

    public void setId_sm(Integer id_sm) {
        this.id_sm = id_sm;
    }
}
