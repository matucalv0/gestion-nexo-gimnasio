package com.nexo.gestion.controller;

import com.nexo.gestion.dto.EmpleadoDTO;
import com.nexo.gestion.services.EmpleadoService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/empleados")
public class EmpleadoController {
    private final EmpleadoService empleadoService;

    public EmpleadoController(EmpleadoService empleadoService){
        this.empleadoService = empleadoService;
    }

    @PreAuthorize("hasAnyRole('ADMIN')")
    @PostMapping
    public ResponseEntity<EmpleadoDTO> altaEmpleado(@Valid @RequestBody EmpleadoDTO empleadoDTO){
        EmpleadoDTO empleado = empleadoService.registrarEmpleado(empleadoDTO);
        return ResponseEntity.ok(empleado);
    }

    @PreAuthorize("hasAnyRole('ADMIN')")
    @PatchMapping("/{dni}/baja")
    public ResponseEntity<EmpleadoDTO> bajaEmpleado(@PathVariable String dni){
        EmpleadoDTO empleado = empleadoService.bajaEmpleado(dni);
        return ResponseEntity.ok(empleado);
    }

    @PreAuthorize("hasAnyRole('ADMIN','EMPLEADO')")
    @PatchMapping("/{dni}")
    public ResponseEntity<EmpleadoDTO> patchEmpleado(@Valid @RequestBody EmpleadoDTO empleadoDTO, @PathVariable String dni){
        EmpleadoDTO empleado = empleadoService.patchEmpleado(dni, empleadoDTO);
        return ResponseEntity.ok(empleado);
    }

    @PreAuthorize("hasAnyRole('ADMIN','EMPLEADO')")
    @GetMapping("/{dni}")
    public ResponseEntity<EmpleadoDTO> buscarPorDni(@PathVariable String dni){
        EmpleadoDTO empleado = empleadoService.buscarEmpleadoPorDni(dni);
        return ResponseEntity.ok(empleado);
    }

    @PreAuthorize("hasAnyRole('ADMIN','EMPLEADO')")
    @GetMapping
    public ResponseEntity<List<EmpleadoDTO>> mostrarEmpleados(){
        List<EmpleadoDTO> empleados = empleadoService.buscarEmpleados();
        return ResponseEntity.ok(empleados);
    }


}
