package com.nexo.gestion.dto;



import java.math.BigDecimal;

public class DetallePagoCreateDTO {
    private Integer cantidad;
    private BigDecimal precioUnitario;
    private Integer idProducto;
    private String idSocio;
    private Integer idMembresia;

    public DetallePagoCreateDTO(){}

    public DetallePagoCreateDTO(Integer cantidad, BigDecimal precioUnitario, Integer idProducto, String idSocio, Integer idMembresia) {
        this.cantidad = cantidad;
        this.precioUnitario = precioUnitario;
        this.idProducto = idProducto;
        this.idSocio = idSocio;
        this.idMembresia = idMembresia;
    }


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

    public String getIdSocio() {
        return idSocio;
    }

    public Integer getIdMembresia() {
        return idMembresia;
    }

    public void setIdMembresia(Integer idMembresia) {
        this.idMembresia = idMembresia;
    }

    public void setIdSocio(String idSocio) {
        this.idSocio = idSocio;
    }
}
