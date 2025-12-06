package com.nexo.gestion.controller;

import com.nexo.gestion.dto.ProductoCreateDTO;
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
    public ResponseEntity<List<Producto>> mostrarProductos(){
        List<Producto> productos = productoService.buscarProductos();
        return ResponseEntity.ok(productos);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Producto> mostrarProductoPorId(@PathVariable Integer id){
        Producto producto = productoService.buscarProductoPorId(id);
        return ResponseEntity.ok(producto);
    }

    @PostMapping
    public ResponseEntity<Producto> altaProducto(@RequestBody ProductoCreateDTO productoCreateDTO){
        Producto producto = productoService.registrarProducto(productoCreateDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(producto);
    }

    @PatchMapping("/{id}/baja")
    public ResponseEntity<Producto> bajaProducto(@PathVariable Integer id){
        Producto producto = productoService.bajaProducto(id);
        return ResponseEntity.ok(producto);
    }

    @PatchMapping("/{id}")
    public ResponseEntity<Producto> patchProducto(@PathVariable Integer id, @RequestBody ProductoPatchDTO productoPatchDTO){
        Producto producto = productoService.patchProducto(id, productoPatchDTO);
        return ResponseEntity.ok(producto);
    }







}
