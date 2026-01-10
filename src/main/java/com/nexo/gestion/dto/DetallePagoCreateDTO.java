package com.nexo.gestion.dto;



import java.math.BigDecimal;

public class DetallePagoCreateDTO {
    private Integer cantidad;
    private BigDecimal precioUnitario;
    private Integer idProducto;
    private Integer idSocio;
    private Integer idMembresia;


    public Integer getCantidad() {
        return cantidad;
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


    public Integer getIdProducto() {
        return idProducto;
    }

    public void setIdProducto(Integer idProducto) {
        this.idProducto = idProducto;
    }

    public Integer getIdSocio() {
        return idSocio;
    }

    public Integer getIdMembresia() {
        return idMembresia;
    }

    public void setIdMembresia(Integer idMembresia) {
        this.idMembresia = idMembresia;
    }

    public void setIdSocio(Integer idSocio) {
        this.idSocio = idSocio;
    }
}
