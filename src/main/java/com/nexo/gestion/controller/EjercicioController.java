package com.nexo.gestion.controller;

import com.nexo.gestion.dto.EjercicioDTO;
import com.nexo.gestion.entity.Ejercicio;
import com.nexo.gestion.services.EjercicioService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/ejercicios")
public class EjercicioController {
    private final EjercicioService ejercicioService;

    public EjercicioController(EjercicioService ejercicioService) {
        this.ejercicioService = ejercicioService;
    }

    @PreAuthorize("hasAnyRole('ADMIN','EMPLEADO')")
    @GetMapping
    public ResponseEntity<List<EjercicioDTO>> buscarEjercicios() {
        List<EjercicioDTO> ejercicios = ejercicioService.buscarEjercicios();
        return ResponseEntity.ok(ejercicios);
    }

    @PreAuthorize("hasAnyRole('ADMIN')")
    @PostMapping
    public ResponseEntity<EjercicioDTO> altaEjercicio(@Valid @RequestBody EjercicioDTO ejercicio) {
        EjercicioDTO ejercicioDTO = ejercicioService.registrarEjercicio(ejercicio);
        return ResponseEntity.status(HttpStatus.CREATED).body(ejercicioDTO);
    }

    @PreAuthorize("hasAnyRole('ADMIN')")
    @PutMapping("/{id}")
    public ResponseEntity<EjercicioDTO> actualizarEjercicio(@PathVariable Integer id, @Valid @RequestBody EjercicioDTO ejercicio) {
        EjercicioDTO actualizado = ejercicioService.actualizarEjercicio(id, ejercicio);
        return ResponseEntity.ok(actualizado);
    }

    @PreAuthorize("hasAnyRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminarEjercicio(@PathVariable Integer id) {
        ejercicioService.eliminarEjercicio(id);
        return ResponseEntity.noContent().build();
    }
}
