package com.nexo.gestion.controller;

import com.nexo.gestion.dto.*;
import com.nexo.gestion.services.RutinaService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/rutinas")
public class RutinaController {
    private final RutinaService rutinaService;

    public RutinaController(RutinaService rutinaService) {
        this.rutinaService = rutinaService;
    }

    // ✅ CREATE: POST /rutinas
    @PostMapping
    public ResponseEntity<RutinaDTO> crearRutina(@RequestBody RutinaCreateDTO dto) {
        RutinaDTO rutinaDTO = rutinaService.crearRutinaConDetalles(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(rutinaDTO);
    }

    // ✅ READ: GET /rutinas
    @GetMapping
    public ResponseEntity<List<RutinaDTO>> listarRutinas() {
        return ResponseEntity.ok(rutinaService.buscarRutinas());
    }

    // ✅ READ: GET /rutinas/{id}
    @GetMapping("/{id}")
    public ResponseEntity<RutinaDTO> obtenerRutina(@PathVariable Integer id) {
        return ResponseEntity.ok(rutinaService.obtenerRutinaPorId(id));
    }

    // ✅ UPDATE: PUT /rutinas/{id}
    @PutMapping("/{id}")
    public ResponseEntity<RutinaDTO> actualizarRutina(@PathVariable Integer id, @RequestBody RutinaUpdateDTO dto) {
        if (!id.equals(dto.idRutina())) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(rutinaService.actualizarRutina(dto));
    }

    // ✅ DELETE: DELETE /rutinas/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminarRutina(@PathVariable Integer id) {
        rutinaService.eliminarRutina(id);
        return ResponseEntity.noContent().build();
    }

    // ✅ PATCH detalle: PATCH /rutinas/detalles/{idDetalle}
    @PatchMapping("/detalles/{idDetalle}")
    public ResponseEntity<RutinaDetalleDTO> actualizarDetalle(
            @PathVariable Long idDetalle,
            @RequestBody RutinaDetalleUpdateDTO dto) {
        return ResponseEntity.ok(rutinaService.actualizarDetalle(idDetalle, dto));
    }
}
