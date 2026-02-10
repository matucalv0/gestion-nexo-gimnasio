package com.nexo.gestion.controller;

import com.nexo.gestion.dto.GastoDTO;
import com.nexo.gestion.services.GastoService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/gastos")
public class GastoController {
    private final GastoService gastoService;

    public GastoController(GastoService gastoService){
        this.gastoService = gastoService;
    }

    @PreAuthorize("hasAnyRole('ADMIN','EMPLEADO')")
    @PostMapping
    public ResponseEntity<GastoDTO> altaGasto(@Valid @RequestBody GastoDTO gastoDTO){
        return ResponseEntity.status(HttpStatus.CREATED).body(gastoService.registrarGasto(gastoDTO));
    }

    @PreAuthorize("hasAnyRole('ADMIN','EMPLEADO')")
    @GetMapping
    public ResponseEntity<List<GastoDTO>> mostrarGastos(){
        return ResponseEntity.ok(gastoService.buscarGastos());
    }

    @PreAuthorize("hasAnyRole('ADMIN','EMPLEADO')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminarGasto(@PathVariable Integer id){
        gastoService.eliminarGasto(id);
        return ResponseEntity.noContent().build();
    }

}
