package com.nexo.gestion.controller;

import com.nexo.gestion.dto.MedioPagoDTO;
import com.nexo.gestion.services.MedioPagoService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/mediosdepago")
public class MedioPagoController {
    private final MedioPagoService medioPagoService;

    public MedioPagoController(MedioPagoService medioPagoService){
        this.medioPagoService = medioPagoService;
    }

    @PreAuthorize("hasAnyRole('ADMIN')")
    @PostMapping
    public ResponseEntity<MedioPagoDTO> altaMedioPago(@RequestBody MedioPagoDTO medioPagoDTO){
        MedioPagoDTO medioPago = medioPagoService.registrarMedioPago(medioPagoDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(medioPago);
    }

    @PreAuthorize("hasAnyRole('ADMIN','EMPLEADO')")
    @GetMapping
    public ResponseEntity<List<MedioPagoDTO>> mostrarMediosDePago(){
        List<MedioPagoDTO> mediosdepago = medioPagoService.buscarMediosDePago();
        return ResponseEntity.ok(mediosdepago);


    }


}
