package com.nexo.gestion.controller;

import com.nexo.gestion.dto.ProductoCreateDTO;
import com.nexo.gestion.dto.ProductoDTO;
import com.nexo.gestion.dto.ProductoPatchDTO;
import com.nexo.gestion.dto.SocioDTO;
import com.nexo.gestion.entity.Producto;
import com.nexo.gestion.services.ProductoService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.RequestEntity;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/productos")
public class ProductoController {
    private final ProductoService productoService;

    public ProductoController(ProductoService productoService){
        this.productoService = productoService;
    }

    @PreAuthorize("hasAnyRole('ADMIN','EMPLEADO')")
    @GetMapping
    public ResponseEntity<List<ProductoDTO>> mostrarProductos(){
        List<ProductoDTO> productos = productoService.buscarProductos();
        return ResponseEntity.ok(productos);
    }

    @PreAuthorize("hasAnyRole('ADMIN','EMPLEADO')")
    @GetMapping("/{id}")
    public ResponseEntity<ProductoDTO> mostrarProductoPorId(@PathVariable Integer id){
        ProductoDTO producto = productoService.buscarProductoPorId(id);
        return ResponseEntity.ok(producto);
    }

    @PreAuthorize("hasAnyRole('ADMIN')")
    @PostMapping
    public ResponseEntity<ProductoDTO> altaProducto(@Valid @RequestBody ProductoCreateDTO productoCreateDTO){
        ProductoDTO producto = productoService.registrarProducto(productoCreateDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(producto);
    }

    @PreAuthorize("hasAnyRole('ADMIN')")
    @PatchMapping("/{id}/baja")
    public ResponseEntity<ProductoDTO> bajaProducto(@PathVariable Integer id){
        ProductoDTO producto = productoService.bajaProducto(id);
        return ResponseEntity.ok(producto);
    }

    @PreAuthorize("hasAnyRole('ADMIN')")
    @PatchMapping("/{id}")
    public ResponseEntity<ProductoDTO> patchProducto(@PathVariable Integer id, @Valid @RequestBody ProductoPatchDTO productoPatchDTO){
        ProductoDTO producto = productoService.patchProducto(id, productoPatchDTO);
        return ResponseEntity.ok(producto);
    }

    @PreAuthorize("hasAnyRole('ADMIN','EMPLEADO')")
    @GetMapping("/search")
    public ResponseEntity<List<ProductoDTO>> buscarSocioPorNombre(@RequestParam("q") String idOrNombre){
        List<ProductoDTO> productos = productoService.buscarProductoPorIdOCodigo(idOrNombre);
        return ResponseEntity.ok(productos);
    }







}
