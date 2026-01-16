package com.nexo.gestion.dto;

import jakarta.validation.constraints.NotBlank;

public class SocioPatchDTO {
    String dni;
    @NotBlank(message = "Debe ingresar algun nombre")
    private String nombre;
    @NotBlank(message = "Debe ingresar algun telefono")
    private String telefono;
    @NotBlank(message = "Debe ingresar algun email")
    private String email;
    private Boolean activo;

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
