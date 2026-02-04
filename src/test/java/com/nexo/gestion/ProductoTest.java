package com.nexo.gestion;

import com.nexo.gestion.dto.ProductoCreateDTO;
import com.nexo.gestion.dto.ProductoDTO;
import com.nexo.gestion.dto.ProductoPatchDTO;
import com.nexo.gestion.exceptions.ObjetoDuplicadoException;
import com.nexo.gestion.exceptions.ObjetoNoEncontradoException;
import com.nexo.gestion.services.ProductoService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.annotation.Rollback;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
public class ProductoTest {
    @Autowired
    private ProductoService productoService;

    private ProductoCreateDTO crearProductoDTO(String nombre, BigDecimal precio, Integer stock) {
        ProductoCreateDTO dto = new ProductoCreateDTO();
        dto.setNombre(nombre);
        dto.setPrecioSugerido(precio);
        dto.setStock(stock);
        return dto;
    }

    @Test
    @Transactional
    @Rollback
    public void registrarProducto_guardaCorrectamente() {
        ProductoCreateDTO dto = crearProductoDTO("Proteina Whey", new BigDecimal("25000"), 10);
        
        ProductoDTO guardado = productoService.registrarProducto(dto);
        
        assertNotNull(guardado.idProducto());
        assertEquals("Proteina Whey", guardado.nombre());
        assertEquals(new BigDecimal("25000"), guardado.precioSugerido());
        assertEquals(10, guardado.stock());
        assertTrue(guardado.activo());
    }

    @Test
    @Transactional
    @Rollback
    public void registrarProducto_lanzaExcepcionSiDuplicado() {
        ProductoCreateDTO dto = crearProductoDTO("Creatina", new BigDecimal("15000"), 5);
        productoService.registrarProducto(dto);
        
        ProductoCreateDTO dtoDuplicado = crearProductoDTO("Creatina", new BigDecimal("18000"), 3);
        
        assertThrows(ObjetoDuplicadoException.class, () -> 
            productoService.registrarProducto(dtoDuplicado)
        );
    }

    @Test
    @Transactional
    @Rollback
    public void buscarProductoPorId_lanzaExcepcionSiNoExiste() {
        assertThrows(ObjetoNoEncontradoException.class, () -> 
            productoService.buscarProductoPorId(99999)
        );
    }

    @Test
    @Transactional
    @Rollback
    public void bajaProducto_marcaComoInactivo() {
        ProductoCreateDTO dto = crearProductoDTO("Pre-Entreno", new BigDecimal("20000"), 8);
        ProductoDTO guardado = productoService.registrarProducto(dto);
        
        ProductoDTO dado_de_baja = productoService.bajaProducto(guardado.idProducto());
        
        assertFalse(dado_de_baja.activo());
    }

    @Test
    @Transactional
    @Rollback
    public void patchProducto_actualizaCamposParcialmente() {
        ProductoCreateDTO dto = crearProductoDTO("BCAA", new BigDecimal("12000"), 20);
        ProductoDTO guardado = productoService.registrarProducto(dto);
        
        ProductoPatchDTO patch = new ProductoPatchDTO();
        patch.setStock(15);
        patch.setPrecioSugerido(new BigDecimal("14000"));
        
        ProductoDTO actualizado = productoService.patchProducto(guardado.idProducto(), patch);
        
        assertEquals("BCAA", actualizado.nombre());
        assertEquals(new BigDecimal("14000"), actualizado.precioSugerido());
        assertEquals(15, actualizado.stock());
        assertTrue(actualizado.activo());
    }
}
