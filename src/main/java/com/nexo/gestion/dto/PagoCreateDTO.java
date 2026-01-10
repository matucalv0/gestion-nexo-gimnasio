package com.nexo.gestion.dto;


import com.nexo.gestion.entity.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;


import java.util.ArrayList;
import java.util.List;

public class PagoCreateDTO {
    @NotBlank
    private EstadoPago estado;
    @Pattern(
            regexp = "\\d{7,8}",
            message = "El DNI debe tener 7 u 8 dígitos numéricos"
    )
    private String dniSocio; // opcional
    @NotBlank
    private Integer idMedioPago;
    @NotBlank
    private String dniEmpleado;
    @NotBlank
    private List<DetallePagoCreateDTO> detalles = new ArrayList<>();

    public EstadoPago getEstado() {
        return estado;
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
}

