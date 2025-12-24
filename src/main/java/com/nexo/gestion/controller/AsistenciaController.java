package com.nexo.gestion.controller;

import com.nexo.gestion.dto.AsistenciaDTO;
import com.nexo.gestion.dto.AsistenciaSocioIdDTO;
import com.nexo.gestion.dto.SocioDTO;
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
    public ResponseEntity<List<AsistenciaDTO>> mostrarAsistencias(){
        List<AsistenciaDTO> asistencias = asistenciaService.buscarAsistencias();
        return ResponseEntity.ok(asistencias);

    }

    @PreAuthorize("hasAnyRole('ADMIN','EMPLEADO')")
    @GetMapping("/search")
    public ResponseEntity<List<AsistenciaDTO>> buscarAsistenciaPorNombreODNI(@RequestParam("q") String dniOrNombre){
        List<AsistenciaDTO> asistencias = asistenciaService.buscarAsistencia(dniOrNombre);
        return ResponseEntity.ok(asistencias);
    }


}
