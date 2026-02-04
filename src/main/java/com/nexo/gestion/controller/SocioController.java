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

import java.util.HashMap;
import java.util.List;
import java.util.Map;

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
    public ResponseEntity<SocioDTO> actualizar(@PathVariable String dni, @Valid @RequestBody SocioPatchDTO socioPatchDTO){
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
    public Map<String, Integer> asistenciasDisponibles(@PathVariable String dni) {
        return Map.of(
                "disponibles",
                socioService.asistenciasDisponibles(dni)
        );
    }



    @PreAuthorize("hasAnyRole('ADMIN','EMPLEADO')")
    @GetMapping("/{dni}/membresia-vigente")
    public ResponseEntity<MembresiaVigenteDTO> membresiaVigente(@PathVariable String dni){
        MembresiaVigenteDTO membresia = socioService.membresiaVigenteSocio(dni);
        return ResponseEntity.ok(membresia);
    }

    @GetMapping("/dias-para-vencer-membresiavigente")
    public ResponseEntity<Integer> diasParaVencerMembresiaVigente(@RequestParam("q") String dni){
        return ResponseEntity.ok(socioService.diasParaVencimientoMembresiaVigente(dni));
    }

    @GetMapping("/activo-mes")
    public  ResponseEntity<Boolean> socioIsActivoMes(@RequestParam("dni") String dni){
        return ResponseEntity.ok(socioService.socioActivoMes(dni));
    }

    @PostMapping("/activo-mes-listado")
    public ResponseEntity<Map<String, Boolean>> sociosActivosEnElMes(@RequestBody List<String> dnis) {
        return ResponseEntity.ok(socioService.listadoSociosActivosEnELMes(dnis));

    }

    @PreAuthorize("hasAnyRole('ADMIN')")
    @GetMapping("/inactivos")
    public ResponseEntity<List<SocioInactivoDTO>> sociosInactivos(
            @RequestParam(value = "dias", defaultValue = "7") Integer dias) {
        return ResponseEntity.ok(socioService.obtenerSociosInactivos(dias));
    }

}
