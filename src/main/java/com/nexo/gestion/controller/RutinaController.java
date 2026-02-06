package com.nexo.gestion.controller;

import com.nexo.gestion.dto.*;
import com.nexo.gestion.services.RutinaService;
import com.nexo.gestion.services.RutinaImportService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/rutinas")
public class RutinaController {
    private final RutinaService rutinaService;
    private final RutinaImportService rutinaImportService;

    public RutinaController(RutinaService rutinaService, RutinaImportService rutinaImportService) {
        this.rutinaService = rutinaService;
        this.rutinaImportService = rutinaImportService;
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

    // ✅ IMPORT: POST /rutinas/importar
    @PostMapping("/importar")
    public ResponseEntity<?> importarRutinaDesdeExcel(
            @RequestParam("file") MultipartFile file,
            @RequestParam("dniEmpleado") String dniEmpleado,
            @RequestParam(value = "dniSocio", required = false) String dniSocio) {
        try {
            Integer idRutina = rutinaImportService.importarRutinasDesdeExcel(file, dniEmpleado, dniSocio);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(Map.of("idRutina", idRutina, "mensaje", "Rutina importada exitosamente"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ✅ ASSIGN: POST /rutinas/{id}/asignar
    @PostMapping("/{id}/asignar")
    public ResponseEntity<?> asignarRutinaAMultiplesSocios(
            @PathVariable Integer id,
            @RequestBody List<String> dnisSocios) {
        try {
            List<Integer> rutinasCreadas = rutinaService.asignarRutinaAMultiplesSocios(id, dnisSocios);
            return ResponseEntity.ok(Map.of(
                    "mensaje", "Rutina asignada a " + rutinasCreadas.size() + " socio(s)",
                    "rutinas", rutinasCreadas));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ✅ VIEW ASSIGNED: GET /rutinas/{id}/socios
    @GetMapping("/{id}/socios")
    public ResponseEntity<List<SocioDTO>> verSociosAsignados(@PathVariable Integer id) {
        return ResponseEntity.ok(rutinaService.obtenerSociosConRutina(id));
    }
}
