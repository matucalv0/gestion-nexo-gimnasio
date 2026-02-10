package com.nexo.gestion.controller;

import com.nexo.gestion.dto.*;
import com.nexo.gestion.services.RutinaService;
import com.nexo.gestion.services.RutinaImportService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
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


    @PreAuthorize("hasAnyRole('ADMIN','EMPLEADO')")
    @PostMapping
    public ResponseEntity<RutinaDTO> crearRutina(@Valid @RequestBody RutinaCreateDTO dto) {
        if (dto.dniSocio() == null || dto.dniSocio().isBlank()) {
            throw new IllegalArgumentException("No se permite crear Plantillas manualmente. Use la importación de Excel.");
        }
        RutinaDTO rutinaDTO = rutinaService.crearRutinaConDetalles(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(rutinaDTO);
    }

    @PreAuthorize("hasAnyRole('ADMIN','EMPLEADO')")
    @GetMapping
    public ResponseEntity<List<RutinaDTO>> listarRutinas() {
        return ResponseEntity.ok(rutinaService.buscarRutinas());
    }


    @PreAuthorize("hasAnyRole('ADMIN','EMPLEADO')")
    @GetMapping("/plantillas")
    public ResponseEntity<PageResponseDTO<RutinaDTO>> listarPlantillas(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(rutinaService.buscarPlantillas(page, size));
    }

    @PreAuthorize("hasAnyRole('ADMIN','EMPLEADO')")
    @GetMapping("/asignadas")
    public ResponseEntity<PageResponseDTO<RutinaDTO>> listarRutinasAsignadas(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(rutinaService.buscarRutinasAsignadas(page, size));
    }

    @PreAuthorize("hasAnyRole('ADMIN','EMPLEADO')")
    @GetMapping("/{id}")
    public ResponseEntity<RutinaDTO> obtenerRutina(@PathVariable Integer id) {
        return ResponseEntity.ok(rutinaService.obtenerRutinaPorId(id));
    }


    @PreAuthorize("hasAnyRole('ADMIN','EMPLEADO')")
    @PutMapping("/{id}")
    public ResponseEntity<RutinaDTO> actualizarRutina(@PathVariable Integer id, @Valid @RequestBody RutinaUpdateDTO dto) {
        if (!id.equals(dto.idRutina())) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(rutinaService.actualizarRutina(dto));
    }

    @PreAuthorize("hasAnyRole('ADMIN','EMPLEADO')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminarRutina(@PathVariable Integer id) {
        rutinaService.eliminarRutina(id);
        return ResponseEntity.noContent().build();
    }

    @PreAuthorize("hasAnyRole('ADMIN','EMPLEADO')")
    @PatchMapping("/detalles/{idDetalle}")
    public ResponseEntity<RutinaDetalleDTO> actualizarDetalle(
            @PathVariable Long idDetalle,
            @Valid @RequestBody RutinaDetalleUpdateDTO dto) {
        return ResponseEntity.ok(rutinaService.actualizarDetalle(idDetalle, dto));
    }

    @PreAuthorize("hasAnyRole('ADMIN','EMPLEADO')")
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

    @PreAuthorize("hasAnyRole('ADMIN','EMPLEADO')")
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

    @PreAuthorize("hasAnyRole('ADMIN','EMPLEADO')")
    @GetMapping("/{id}/socios")
    public ResponseEntity<List<SocioDTO>> verSociosAsignados(@PathVariable Integer id) {
        return ResponseEntity.ok(rutinaService.obtenerSociosConRutina(id));
    }

    @PreAuthorize("hasAnyRole('ADMIN','EMPLEADO')")
    @PostMapping("/{id}/duplicar")
    public ResponseEntity<?> duplicarPlantilla(
            @PathVariable Integer id,
            @RequestParam(value = "dniEmpleado", required = false) String dniEmpleado) {
        try {
            RutinaDTO nuevaPlantilla = rutinaService.duplicarPlantilla(id, dniEmpleado);
            return ResponseEntity.status(HttpStatus.CREATED).body(nuevaPlantilla);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
