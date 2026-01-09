package com.nexo.gestion.controller;

import com.nexo.gestion.dto.GrupoMuscularDTO;
import com.nexo.gestion.services.GrupoMuscularService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/grupos-musculares")
public class GrupoMuscularController {
    private final GrupoMuscularService grupoMuscularService;

    public GrupoMuscularController(GrupoMuscularService grupoMuscularService){
        this.grupoMuscularService = grupoMuscularService;
    }

    @PostMapping
    public ResponseEntity<GrupoMuscularDTO> altaGrupoMuscular(@RequestBody GrupoMuscularDTO grupoMuscularDTO){
        GrupoMuscularDTO grupoMuscular = grupoMuscularService.registrarGrupoMuscular(grupoMuscularDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(grupoMuscular);
    }

    @GetMapping
    public ResponseEntity<List<GrupoMuscularDTO>> mostrarGruposMusculares(){
        List<GrupoMuscularDTO> grupos = grupoMuscularService.buscarGruposMusculares();
        return ResponseEntity.ok(grupos);
    }

}
