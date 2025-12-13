package com.nexo.gestion.controller;

import com.nexo.gestion.dto.PuestoDTO;
import com.nexo.gestion.services.PuestoService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/puestos")
public class PuestoController {
    private final PuestoService puestoService;

    public PuestoController(PuestoService puestoService){
        this.puestoService = puestoService;
    }

    @PostMapping
    public ResponseEntity<PuestoDTO> altaPuesto(@RequestBody PuestoDTO puestoDTO){
        PuestoDTO puesto = puestoService.registrarPuesto(puestoDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(puesto);
    }

    @GetMapping
    public ResponseEntity<List<PuestoDTO>> mostrarPuestos(){
        List<PuestoDTO> puestos = puestoService.buscarPuestos();
        return ResponseEntity.ok(puestos);


    }




}
