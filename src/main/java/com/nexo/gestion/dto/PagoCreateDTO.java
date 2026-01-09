package com.nexo.gestion.dto;


import com.nexo.gestion.entity.*;


import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

public class PagoCreateDTO {

    private EstadoPago estado;
    private String dni_socio; // opcional
    private Integer id_medioPago;
    private List<DetallePagoCreateDTO> detalles = new ArrayList<>();

    public EstadoPago getEstado() {
        return estado;
    }

    public void setEstado(EstadoPago estado) {
        this.estado = estado;
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

