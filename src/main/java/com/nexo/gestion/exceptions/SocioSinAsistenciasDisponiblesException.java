package com.nexo.gestion.exceptions;

public class SocioSinAsistenciasDisponiblesException extends RuntimeException{
    public SocioSinAsistenciasDisponiblesException(){
        super("El socio no tiene mas asistencias disponibles");
    }
}
