package com.nexo.gestion.dto;


import com.nexo.gestion.entity.*;


import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

public class PagoCreateDTO {
    private EstadoPago estado;
    private BigDecimal monto;
    private String dni_empleado;
    private String dni_socio;
    private Integer id_medioPago;
    List<DetallePagoCreateDTO> detalles = new ArrayList<>();

    public EstadoPago getEstado() {
        return estado;
    }

    public void setEstado(EstadoPago estado) {
        this.estado = estado;
    }

    public BigDecimal getMonto() {
        return monto;
    }

    public void setMonto(BigDecimal monto) {
        this.monto = monto;
    }

    public String getDni_empleado() {
        return dni_empleado;
    }

    public void setDni_empleado(String dni_empleado) {
        this.dni_empleado = dni_empleado;
    }

    public String getDni_socio() {
        return dni_socio;
    }

    public void setDni_socio(String dni_socio) {
        this.dni_socio = dni_socio;
    }

    public Integer getId_medioPago() {
        return id_medioPago;
    }

    public void setId_medioPago(Integer id_medioPago) {
        this.id_medioPago = id_medioPago;
    }

    public List<DetallePagoCreateDTO> getDetalles() {
        return detalles;
    }

    public void setDetalles(List<DetallePagoCreateDTO> detalles) {
        this.detalles = detalles;
    }
}
