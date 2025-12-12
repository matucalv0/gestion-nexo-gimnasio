package com.nexo.gestion.controller;

import com.nexo.gestion.dto.MembresiaCreateDTO;
import com.nexo.gestion.dto.MembresiaDTO;
import com.nexo.gestion.dto.MembresiaPatchDTO;
import com.nexo.gestion.entity.Membresia;
import com.nexo.gestion.services.MembresiaService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/membresias")
public class MembresiaController {
    private final MembresiaService membresiaService;

    public MembresiaController(MembresiaService membresiaService){
        this.membresiaService = membresiaService;
    }

    @PostMapping
    public ResponseEntity<MembresiaDTO> altaMembresia(@RequestBody MembresiaCreateDTO membresiaCreateDTO){
        MembresiaDTO membresia = membresiaService.registrarMembresia(membresiaCreateDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(membresia);
    }

    @PatchMapping("/{id}/baja")
    public ResponseEntity<MembresiaDTO> bajaMembresia(@PathVariable Integer id){
        MembresiaDTO membresia = membresiaService.bajaMembresia(id);
        return ResponseEntity.ok(membresia);
    }

    @PatchMapping("/{id}")
    public ResponseEntity<MembresiaDTO> actualizar(@PathVariable Integer id, @RequestBody MembresiaPatchDTO membresiaPatchDTO){
        MembresiaDTO membresia = membresiaService.patchMembresia(id, membresiaPatchDTO);
        return ResponseEntity.ok(membresia);
    }

    @GetMapping
    public ResponseEntity<List<MembresiaDTO>> mostrarMembresias(){
        List<MembresiaDTO> membresias = membresiaService.mostrarMembresias();
        return ResponseEntity.ok(membresias);
    }

    @GetMapping("/{id}")
    public ResponseEntity<MembresiaDTO> mostrarMembresiaPorId(@PathVariable Integer id){
        MembresiaDTO membresia = membresiaService.buscarMembresiaPorId(id);
        return ResponseEntity.ok(membresia);
    }






}
