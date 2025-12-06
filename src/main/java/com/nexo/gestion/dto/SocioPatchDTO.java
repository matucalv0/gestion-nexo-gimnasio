package com.nexo.gestion.dto;

public class SocioPatchDTO {
    private String telefono;
    private String email;
    private Boolean activo;

    public String getTelefono() {
        return telefono;
    }

    public String getEmail() {
        return email;
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
