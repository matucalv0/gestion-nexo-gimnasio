package com.nexo.gestion.controller;

import com.nexo.gestion.dto.*;
import com.nexo.gestion.entity.Pago;
import com.nexo.gestion.entity.Socio;
import com.nexo.gestion.entity.SocioMembresia;
import com.nexo.gestion.services.SocioService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/socios")
public class SocioController {
    private final SocioService socioService;

    public SocioController(SocioService socioService){
        this.socioService = socioService;
    }


    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<SocioDTO> altaSocio(@Valid @RequestBody SocioCreateDTO socioCreateDTO){
        SocioDTO socio = socioService.registrarSocio(socioCreateDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(socio);
    }

    @PreAuthorize("hasAnyRole('ADMIN','EMPLEADO')")
    @GetMapping("/{dni}")
    public ResponseEntity<SocioDTO> buscarPorDni(@PathVariable String dni){
        SocioDTO socio = socioService.buscarSocioPorDni(dni);
        return ResponseEntity.ok(socio);
    }

    @PreAuthorize("hasAnyRole('ADMIN','EMPLEADO')")
    @GetMapping("/{dni}/pagos")
    public ResponseEntity<List<PagoDTO>> buscarPagosPorDni(@PathVariable String dni){
        List<PagoDTO> pagos = socioService.buscarPagosPorDni(dni);
        return ResponseEntity.ok(pagos);
    }

    @PreAuthorize("hasAnyRole('ADMIN','EMPLEADO')")
    @GetMapping
    public ResponseEntity<List<SocioDTO>> mostrarSocios(){
        List<SocioDTO> socios = socioService.buscarSocios();
        return ResponseEntity.ok(socios);

    }

    @PreAuthorize("hasAnyRole('ADMIN')")
    @PatchMapping("/{dni}/baja")
    public ResponseEntity<SocioDTO> darDeBajaSocio(@PathVariable String dni){
        SocioDTO socio = socioService.bajaSocio(dni);
        return ResponseEntity.ok(socio);
    }

    @PreAuthorize("hasAnyRole('ADMIN','EMPLEADO')")
    @PatchMapping("/{dni}")
    public ResponseEntity<SocioDTO> actualizar(@PathVariable String dni, @RequestBody SocioPatchDTO socioPatchDTO){
        SocioDTO socio = socioService.patchSocio(dni, socioPatchDTO);
        return ResponseEntity.ok(socio);
    }

    @PreAuthorize("hasAnyRole('ADMIN','EMPLEADO')")
    @PostMapping("/{dni}/membresias/{idMembresia}")
    public ResponseEntity<SocioMembresiaDTO> crearMembresiaParaSocio(@PathVariable String dni, @PathVariable Integer id_membresia){
        SocioMembresiaDTO suscripcion = socioService.asignarMembresia(dni, id_membresia);
        return ResponseEntity.ok(suscripcion);
    }

    @PreAuthorize("hasAnyRole('ADMIN','EMPLEADO')")
    @PostMapping("/{dni}/asistencias")
    public ResponseEntity<AsistenciaSocioIdDTO> asistenciaSocio(@PathVariable String dni){
        AsistenciaSocioIdDTO asistencia = socioService.registrarAsistencia(dni);
        return ResponseEntity.ok(asistencia);
    }

    @PreAuthorize("hasAnyRole('ADMIN','EMPLEADO')")
    @GetMapping("/search")
    public ResponseEntity<List<SocioDTO>> buscarSocioPorNombre(@RequestParam("q") String dniOrNombre){
        List<SocioDTO> socios = socioService.buscarSocios(dniOrNombre);
        return ResponseEntity.ok(socios);
    }

    @PreAuthorize("hasAnyRole('ADMIN','EMPLEADO')")
    @GetMapping("/{dni}/asistencias-disponibles")
    public ResponseEntity<Integer> asistenciasDisponibles(@PathVariable String dni) {
        int disponibles = socioService.asistenciasDisponibles(dni);
        return ResponseEntity.ok(disponibles);
    }

    @PreAuthorize("hasAnyRole('ADMIN','EMPLEADO')")
    @GetMapping("/{dni}/membresia-vigente")
    public ResponseEntity<MembresiaVigenteDTO> membresiaVigente(@PathVariable String dni){
        MembresiaVigenteDTO membresia = socioService.membresiaVigente(dni);
        return ResponseEntity.ok(membresia);
    }






}
