package com.nexo.gestion.exceptions;

public class MembresiaVencidaException extends RuntimeException {
    public MembresiaVencidaException() {
        super("Membresía vencida");
    }
}

