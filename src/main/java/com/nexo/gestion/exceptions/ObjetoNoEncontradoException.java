package com.nexo.gestion.exceptions;

public class ObjetoNoEncontradoException extends RuntimeException {
    public ObjetoNoEncontradoException(String mensaje) {
        super("No se encontró el: " + mensaje);
    }
}
