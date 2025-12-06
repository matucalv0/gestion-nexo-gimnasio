package com.nexo.gestion.exceptions;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ObjetoNoEncontradoException.class)
    public ResponseEntity<String> manejarNoEncontrado(ObjetoNoEncontradoException ex) {
        return ResponseEntity
                .status(HttpStatus.NOT_FOUND)   // error 404
                .body(ex.getMessage());
    }

    @ExceptionHandler(ObjetoDuplicadoException.class)
    public ResponseEntity<String> manejarDuplicado(ObjetoDuplicadoException ex) {
        return ResponseEntity
                .status(HttpStatus.CONFLICT)    // error 409
                .body(ex.getMessage());
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<String> manejarErrorGeneral(Exception ex) {
        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR) // error 500
                .body("Error interno del servidor");
    }
}

