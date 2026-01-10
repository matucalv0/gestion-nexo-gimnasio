package com.nexo.gestion.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

import java.io.Serializable;
import java.util.Objects;

@Embeddable
public class DetallePagoId implements Serializable {

    @Column(name = "id_pago")
    private Integer idPago;

    @Column(name = "numero")
    private Integer numero;

    public DetallePagoId(){}

    public DetallePagoId(Integer idPago, Integer numero){
        this.idPago = idPago;
        this.numero = numero;
    }

    @Override
    public boolean equals(Object o) {
        if (!(o instanceof DetallePagoId that)) return false;
        return Objects.equals(idPago, that.idPago) && Objects.equals(numero, that.numero);
    }

    public Integer getIdPago() {
        return idPago;
    }

    public void setIdPago(Integer idPago) {
        this.idPago = idPago;
    }

    @Override
    public String toString() {
        return "DetallePagoId{" +
                "idPago=" + idPago +
                ", numero=" + numero +
                '}';
    }

    public Integer getNumero() {
        return numero;
    }

    public void setNumero(Integer numero) {
        this.numero = numero;
    }

    @Override
    public int hashCode() {
        return Objects.hash(idPago, numero);
    }
}
