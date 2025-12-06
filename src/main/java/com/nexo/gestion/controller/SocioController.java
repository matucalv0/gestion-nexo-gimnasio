package com.nexo.gestion.controller;

import com.nexo.gestion.dto.SocioCreateDTO;
import com.nexo.gestion.dto.SocioPatchDTO;
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
    public ResponseEntity<Socio> altaSocio(@RequestBody SocioCreateDTO socioCreateDTO){
        Socio socio = socioService.registrarSocio(socioCreateDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(socio);
    }

    @GetMapping("/{dni}")
    public ResponseEntity<Socio> buscarPorId(@PathVariable String dni){
        Socio socio = socioService.buscarSocioPorDni(dni);
        return ResponseEntity.ok(socio);
    }

    @GetMapping
    public ResponseEntity<List<Socio>> mostrarSocios(){
        List<Socio> socios = socioService.buscarSocios();
        return ResponseEntity.ok(socios);

    }

    @PatchMapping("/{dni}/baja")
    public ResponseEntity<Socio> darDeBajaSocio(@PathVariable String dni){
        Socio socio = socioService.bajaSocio(dni);
        return ResponseEntity.ok(socio);
    }



    @PatchMapping("/{dni}")
    public ResponseEntity<Socio> actualizar(@PathVariable String dni, @RequestBody SocioPatchDTO socioPatchDTO){
        Socio socio = socioService.patchSocio(dni, socioPatchDTO);
        return ResponseEntity.ok(socio);
    }

    @PostMapping("/{dni}/membresias/{id_membresia}")
    public ResponseEntity<SocioMembresia> crearMembresiaParaSocio(@PathVariable String dni, @PathVariable Integer id_membresia){
        SocioMembresia suscripcion = socioService.asignarMembresia(dni, id_membresia);
        return ResponseEntity.ok(suscripcion);
    }



}
