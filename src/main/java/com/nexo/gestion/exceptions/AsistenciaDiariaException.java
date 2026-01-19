package com.nexo.gestion.exceptions;

public class AsistenciaDiariaException extends RuntimeException {
    public AsistenciaDiariaException() {
        super("El socio ya tiene una asistencia registrada el dia de hoy");
    }
}
