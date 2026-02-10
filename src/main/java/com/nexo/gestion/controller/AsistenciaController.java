package com.nexo.gestion.controller;

import com.nexo.gestion.dto.*;
import com.nexo.gestion.services.AsistenciaService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/asistencias")
public class AsistenciaController {
    private final AsistenciaService asistenciaService;

    public AsistenciaController(AsistenciaService asistenciaService){
        this.asistenciaService = asistenciaService;
    }

    @PreAuthorize("hasAnyRole('ADMIN','EMPLEADO')")
    @GetMapping
    public ResponseEntity<PageResponseDTO<AsistenciaDTO>> mostrarAsistencias(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate desde,
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate hasta,
            @RequestParam(required = false) String q
    ) {
        return ResponseEntity.ok(asistenciaService.buscarAsistenciasPaginadas(page, size, desde, hasta, q));
    }

    @PreAuthorize("hasAnyRole('ADMIN','EMPLEADO')")
    @GetMapping("estadisticas/semana-actual")
    public ResponseEntity<Integer> cantidadAsistenciasSemanaActual(@RequestParam("q") String dni){
        return ResponseEntity.ok(asistenciaService.asistenciasTotalesSemana(dni));
    }

    @PreAuthorize("hasAnyRole('ADMIN','EMPLEADO')")
    @GetMapping("estadisticas/mes")
    public ResponseEntity<EstadisticasAsistenciasMensualDTO> estadisticasMensuales(){
        return ResponseEntity.ok(asistenciaService.estadisticasMensualesAsistencias());
    }

    @PreAuthorize("hasAnyRole('ADMIN','EMPLEADO')")
    @GetMapping("estadisticas")
    public ResponseEntity<List<AsistenciasPorDiaDTO>> asistenciasPorDia(@RequestParam("mes") String mes){
        return ResponseEntity.ok(asistenciaService.totalAsistenciasPorDia(mes));
    }

    @PreAuthorize("hasAnyRole('ADMIN')")
    @GetMapping("estadisticas/hora-pico")
    public ResponseEntity<HoraPicoDTO> horaPico(){
        return ResponseEntity.ok(asistenciaService.obtenerHoraPico());
    }

    @PreAuthorize("hasAnyRole('ADMIN')")
    @GetMapping("estadisticas/distribucion-horaria")
    public ResponseEntity<List<HoraPicoDTO>> distribucionHoraria(){
        return ResponseEntity.ok(asistenciaService.obtenerDistribucionPorHora());
    }

}
