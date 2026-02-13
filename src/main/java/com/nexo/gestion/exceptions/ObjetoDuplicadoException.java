package com.nexo.gestion.exceptions;

public class ObjetoDuplicadoException extends RuntimeException {
    public ObjetoDuplicadoException(String mensaje) {
        super(mensaje + " ya se encuentra registrado");
    }
}
