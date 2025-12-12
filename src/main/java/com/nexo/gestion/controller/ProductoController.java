package com.nexo.gestion.controller;

import com.nexo.gestion.dto.ProductoCreateDTO;
import com.nexo.gestion.dto.ProductoDTO;
import com.nexo.gestion.dto.ProductoPatchDTO;
import com.nexo.gestion.entity.Producto;
import com.nexo.gestion.services.ProductoService;
import org.springframework.http.HttpStatus;
import org.springframework.http.RequestEntity;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/productos")
public class ProductoController {
    private final ProductoService productoService;

    public ProductoController(ProductoService productoService){
        this.productoService = productoService;
    }

    @GetMapping
    public ResponseEntity<List<ProductoDTO>> mostrarProductos(){
        List<ProductoDTO> productos = productoService.buscarProductos();
        return ResponseEntity.ok(productos);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProductoDTO> mostrarProductoPorId(@PathVariable Integer id){
        ProductoDTO producto = productoService.buscarProductoPorId(id);
        return ResponseEntity.ok(producto);
    }

    @PostMapping
    public ResponseEntity<ProductoDTO> altaProducto(@RequestBody ProductoCreateDTO productoCreateDTO){
        ProductoDTO producto = productoService.registrarProducto(productoCreateDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(producto);
    }

    @PatchMapping("/{id}/baja")
    public ResponseEntity<ProductoDTO> bajaProducto(@PathVariable Integer id){
        ProductoDTO producto = productoService.bajaProducto(id);
        return ResponseEntity.ok(producto);
    }

    @PatchMapping("/{id}")
    public ResponseEntity<ProductoDTO> patchProducto(@PathVariable Integer id, @RequestBody ProductoPatchDTO productoPatchDTO){
        ProductoDTO producto = productoService.patchProducto(id, productoPatchDTO);
        return ResponseEntity.ok(producto);
    }







}
