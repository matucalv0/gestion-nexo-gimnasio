package com.nexo.gestion.controller;

import com.nexo.gestion.dto.PagoCreateDTO;
import com.nexo.gestion.entity.Pago;
import com.nexo.gestion.services.PagoService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.function.EntityResponse;

import java.util.List;

@RestController
@RequestMapping("/pagos")
public class PagoController {
    private final PagoService pagoService;

    public PagoController(PagoService pagoService){
        this.pagoService = pagoService;
    }

    @PostMapping
    public ResponseEntity<Pago> altaPago(@RequestBody PagoCreateDTO pagoCreateDTO){
        Pago pago = pagoService.crearPago(pagoCreateDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(pago);
    }
    
    @GetMapping
    public ResponseEntity<List<Pago>> mostrarPagos(){
        List<Pago> pagos = pagoService.buscarPagos();
        return ResponseEntity.ok(pagos);
    }




}
