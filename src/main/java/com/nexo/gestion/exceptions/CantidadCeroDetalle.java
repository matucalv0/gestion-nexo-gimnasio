package com.nexo.gestion.exceptions;

public class CantidadCeroDetalle extends RuntimeException {
    public CantidadCeroDetalle() {
        super("La cantidad tiene que ser mayor a 0");
    }
}
