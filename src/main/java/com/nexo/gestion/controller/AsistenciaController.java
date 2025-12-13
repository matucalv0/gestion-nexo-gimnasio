package com.nexo.gestion.controller;

import com.nexo.gestion.dto.AsistenciaSocioIdDTO;
import com.nexo.gestion.services.AsistenciaService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/asistencias")
public class AsistenciaController {
    private final AsistenciaService asistenciaService;

    public AsistenciaController(AsistenciaService asistenciaService){
        this.asistenciaService = asistenciaService;
    }

    @GetMapping
    public ResponseEntity<List<AsistenciaSocioIdDTO>> mostrarAsistencias(){
        List<AsistenciaSocioIdDTO> asistencias = asistenciaService.buscarAsistencias();
        return ResponseEntity.ok(asistencias);

    }


}
