package com.nexo.gestion.dto;


import com.nexo.gestion.entity.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

import java.time.LocalDate;


import java.util.ArrayList;
import java.util.List;

public class PagoCreateDTO {
    @NotNull
    private EstadoPago estado;
    @Pattern(
            regexp = "\\d{7,8}",
            message = "El DNI debe tener 7 u 8 dígitos numéricos"
    )
    private String dniSocio; // opcional
    @NotNull
    private Integer idMedioPago;
    @NotBlank
    private String dniEmpleado;
    private Integer idDescuento;
    private LocalDate fechaInicioMembresia; // opcional: si se indica, se usa como inicio de la nueva membresía
    @NotNull
    @Valid
    private List<DetallePagoCreateDTO> detalles = new ArrayList<>();

    public EstadoPago getEstado() {
        return estado;
    }

    public PagoCreateDTO(EstadoPago estado,String dniSocio, Integer idMedioPago, String dniEmpleado, List<DetallePagoCreateDTO> detalles) {
        this.detalles = detalles;
        this.dniEmpleado = dniEmpleado;
        this.idMedioPago = idMedioPago;
        this.dniSocio = dniSocio;
        this.estado = estado;
    }

    public void setEstado(EstadoPago estado) {
        this.estado = estado;
    }

    public String getDniEmpleado() {
        return dniEmpleado;
    }

    public void setDniEmpleado(String dniEmpleado) {
        this.dniEmpleado = dniEmpleado;
    }

    public String getDniSocio() {
        return dniSocio;
    }

    public void setDniSocio(String dniSocio) {
        this.dniSocio = dniSocio;
    }

    public Integer getIdMedioPago() {
        return idMedioPago;
    }

    public void setIdMedioPago(Integer idMedioPago) {
        this.idMedioPago = idMedioPago;
    }

    public List<DetallePagoCreateDTO> getDetalles() {
        return detalles;
    }

    public void setDetalles(List<DetallePagoCreateDTO> detalles) {
        this.detalles = detalles;
    }

    public Integer getIdDescuento() {
        return idDescuento;
    }

    public void setIdDescuento(Integer idDescuento) {
        this.idDescuento = idDescuento;
    }

    public LocalDate getFechaInicioMembresia() {
        return fechaInicioMembresia;
    }

    public void setFechaInicioMembresia(LocalDate fechaInicioMembresia) {
        this.fechaInicioMembresia = fechaInicioMembresia;
    }
}

