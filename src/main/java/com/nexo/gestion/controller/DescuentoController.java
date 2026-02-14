package com.nexo.gestion.controller;

import com.nexo.gestion.dto.DescuentoDTO;
import com.nexo.gestion.entity.Descuento;
import com.nexo.gestion.exceptions.ObjetoNoEncontradoException;
import com.nexo.gestion.repository.DescuentoRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/descuentos")
public class DescuentoController {

    private final DescuentoRepository descuentoRepository;

    public DescuentoController(DescuentoRepository descuentoRepository) {
        this.descuentoRepository = descuentoRepository;
    }

    @GetMapping
    public ResponseEntity<List<DescuentoDTO>> obtenerTodos() {
        List<Descuento> descuentos = descuentoRepository.findAll();
        List<DescuentoDTO> dtos = descuentos.stream()
                .map(d -> new DescuentoDTO(d.getIdDescuento(), d.getNombre(), d.getPorcentaje(), d.getActivo()))
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/activos")
    public ResponseEntity<List<DescuentoDTO>> obtenerDescuentosActivos() {
        List<Descuento> descuentos = descuentoRepository.findByActivoTrue();
        List<DescuentoDTO> dtos = descuentos.stream()
                .map(d -> new DescuentoDTO(d.getIdDescuento(), d.getNombre(), d.getPorcentaje(), d.getActivo()))
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @PostMapping
    public ResponseEntity<DescuentoDTO> crear(@RequestBody DescuentoDTO dto) {
        Descuento descuento = new Descuento(dto.getNombre(), dto.getPorcentaje(), true);
        descuento = descuentoRepository.save(descuento);
        return ResponseEntity.ok(new DescuentoDTO(descuento.getIdDescuento(), descuento.getNombre(), descuento.getPorcentaje(), descuento.getActivo()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<DescuentoDTO> actualizar(@PathVariable Integer id, @RequestBody DescuentoDTO dto) {
        Descuento descuento = descuentoRepository.findById(id)
                .orElseThrow(() -> new ObjetoNoEncontradoException("Descuento no encontrado"));
        
        descuento.setNombre(dto.getNombre());
        descuento.setPorcentaje(dto.getPorcentaje());
        if (dto.getActivo() != null) {
            descuento.setActivo(dto.getActivo());
        }
        
        descuento = descuentoRepository.save(descuento);
        return ResponseEntity.ok(new DescuentoDTO(descuento.getIdDescuento(), descuento.getNombre(), descuento.getPorcentaje(), descuento.getActivo()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Integer id) {
        Descuento descuento = descuentoRepository.findById(id)
                .orElseThrow(() -> new ObjetoNoEncontradoException("Descuento no encontrado"));
        
        descuento.setActivo(false);
        descuentoRepository.save(descuento);
        return ResponseEntity.noContent().build();
    }
}
