package com.nexo.gestion.dto;

import com.nexo.gestion.entity.TipoMembresia;
import jakarta.persistence.Column;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

import java.math.BigDecimal;

public class MembresiaCreateDTO {
    @NotNull
    private Integer duracionDias;
    @Column(precision = 10, scale = 2)
    @NotNull
    private BigDecimal precioSugerido;
    @NotBlank
    @Pattern(
            regexp = "^[A-Za-zÁÉÍÓÚáéíóúñÑ +]+$",
            message = "Solo se permiten letras y el símbolo +"
    )
    private String nombre;
    @NotNull
    private TipoMembresia tipoMembresia;
    @NotNull
    private Integer asistenciasPorSemana;

    public MembresiaCreateDTO(){};

    public MembresiaCreateDTO(Integer duracionDias, BigDecimal precioSugerido, String nombre, Integer asistenciasPorSemana, TipoMembresia tipoMembresia){
        this.duracionDias = duracionDias;
        this.precioSugerido = precioSugerido;
        this.nombre = nombre;
        this.asistenciasPorSemana = asistenciasPorSemana;
        this.tipoMembresia = tipoMembresia;
    }


    public Integer getDuracionDias() {
        return duracionDias;
    }

    public TipoMembresia getTipoMembresia() {
        return tipoMembresia;
    }

    public void setTipoMembresia(TipoMembresia tipoMembresia) {
        this.tipoMembresia = tipoMembresia;
    }

    public void setDuracionDias(Integer duracionDias) {
        this.duracionDias = duracionDias;
    }

    public Integer getAsistenciasPorSemana() {
        return asistenciasPorSemana;
    }

    public void setAsistenciasPorSemana(Integer asistenciasPorSemana) {
        this.asistenciasPorSemana = asistenciasPorSemana;
    }

    public BigDecimal getPrecioSugerido() {
        return precioSugerido;
    }

    public void setPrecioSugerido(BigDecimal precioSugerido) {
        this.precioSugerido = precioSugerido;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }
}
