package com.nexo.gestion.controller;

import com.nexo.gestion.dto.*;
import com.nexo.gestion.entity.Pago;
import com.nexo.gestion.entity.Socio;
import com.nexo.gestion.entity.SocioMembresia;
import com.nexo.gestion.services.SocioService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/socios")
public class SocioController {
    private final SocioService socioService;

    public SocioController(SocioService socioService){
        this.socioService = socioService;
    }

    @PostMapping
    public ResponseEntity<SocioDTO> altaSocio(@RequestBody SocioCreateDTO socioCreateDTO){
        SocioDTO socio = socioService.registrarSocio(socioCreateDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(socio);
    }

    @GetMapping("/{dni}")
    public ResponseEntity<SocioDTO> buscarPorDni(@PathVariable String dni){
        SocioDTO socio = socioService.buscarSocioPorDni(dni);
        return ResponseEntity.ok(socio);
    }

    @GetMapping("/{dni}/pagos")
    public ResponseEntity<List<PagoDTO>> buscarPagosPorDni(@PathVariable String dni){
        List<PagoDTO> pagos = socioService.buscarPagosPorDni(dni);
        return ResponseEntity.ok(pagos);
    }

    @GetMapping
    public ResponseEntity<List<SocioDTO>> mostrarSocios(){
        List<SocioDTO> socios = socioService.buscarSocios();
        return ResponseEntity.ok(socios);

    }

    @PatchMapping("/{dni}/baja")
    public ResponseEntity<SocioDTO> darDeBajaSocio(@PathVariable String dni){
        SocioDTO socio = socioService.bajaSocio(dni);
        return ResponseEntity.ok(socio);
    }



    @PatchMapping("/{dni}")
    public ResponseEntity<SocioDTO> actualizar(@PathVariable String dni, @RequestBody SocioPatchDTO socioPatchDTO){
        SocioDTO socio = socioService.patchSocio(dni, socioPatchDTO);
        return ResponseEntity.ok(socio);
    }

    @PostMapping("/{dni}/membresias/{id_membresia}")
    public ResponseEntity<SocioMembresiaDTO> crearMembresiaParaSocio(@PathVariable String dni, @PathVariable Integer id_membresia){
        SocioMembresiaDTO suscripcion = socioService.asignarMembresia(dni, id_membresia);
        return ResponseEntity.ok(suscripcion);
    }




}
