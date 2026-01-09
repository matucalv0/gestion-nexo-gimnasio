package com.nexo.gestion.controller;

import com.nexo.gestion.dto.EjercicioDTO;
import com.nexo.gestion.dto.RutinaDTO;
import com.nexo.gestion.services.RutinaService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/rutinas")
public class RutinaController {
    private final RutinaService rutinaService;

    public RutinaController(RutinaService rutinaService){
        this.rutinaService = rutinaService;
    }

    @PostMapping
    public ResponseEntity<RutinaDTO> altaRutina(@RequestBody RutinaDTO rutina){
        RutinaDTO rutinaDTO = rutinaService.crearRutina(rutina);
        return ResponseEntity.ok(rutinaDTO);
    }

    @PostMapping("/{idRutina}/ejercicios/{idEjercicio}")
    public ResponseEntity<EjercicioDTO> agregarEjercicioARutina(@PathVariable Integer idRutina, @PathVariable Integer idEjercicio){
        EjercicioDTO ejercicioDTO = rutinaService.agregarEjercicio(idRutina, idEjercicio);
        return ResponseEntity.ok(ejercicioDTO);
    }

    @DeleteMapping("/{idRutina}/ejercicios/{idEjercicio}")
    public ResponseEntity<EjercicioDTO> eliminarEjercicioDeRutina(@PathVariable Integer idRutina, @PathVariable Integer idEjercicio){
        EjercicioDTO ejercicioDto = rutinaService.eliminarEjercicio(idRutina, idEjercicio);
        return ResponseEntity.ok(ejercicioDto);
    }


}
