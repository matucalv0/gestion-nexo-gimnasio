package com.nexo.gestion.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

import java.time.LocalDate;

public class SocioPatchDTO {
    String dni;
    @NotBlank(message = "El DNI es obligatorio")
    @Pattern(
            regexp = "\\d{7,8}",
            message = "El DNI debe tener 7 u 8 dígitos numéricos"
    )
    private String nuevoDni;

    @NotBlank(message = "Debe ingresar algun nombre")
    @Pattern(
            regexp = "^[A-Za-zÁÉÍÓÚáéíóúÑñ ]{2,50}$",
            message = "El nombre solo puede contener letras y espacios"
    )
    private String nombre;

    @NotBlank(message = "Debe ingresar algun telefono")
    @Pattern(
            regexp = "\\d{8,15}",
            message = "El teléfono debe ser numérico"
    )
    private String telefono;

    @NotBlank(message = "Debe ingresar algun email")
    @Email
    private String email;

    private Boolean activo;
    private LocalDate fechaNacimiento;

    public String getNuevoDni() {
        return nuevoDni;
    }

    public void setNuevoDni(String nuevoDni) {
        this.nuevoDni = nuevoDni;
    }

    public LocalDate getFechaNacimiento() {
        return fechaNacimiento;
    }

    public void setFechaNacimiento(LocalDate fechaNacimiento) {
        this.fechaNacimiento = fechaNacimiento;
    }

    public String getTelefono() {
        return telefono;
    }

    public String getEmail() {
        return email;
    }

    public String getDni() {
        return dni;
    }

    public void setDni(String dni) {
        this.dni = dni;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public void setActivo(Boolean activo) {
        this.activo = activo;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public Boolean getActivo() {
        return activo;
    }

    public void setActivo(boolean activo) {
        this.activo = activo;
    }

    public void setTelefono(String telefono) {
        this.telefono = telefono;
    }
}
