package com.nexo.gestion.exceptions;

public class MasDeUnaMembresiaEnDetalleException extends RuntimeException {
    public MasDeUnaMembresiaEnDetalleException() {
        super("Mas de una membresia en el detalle");
    }
}
