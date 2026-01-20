package com.nexo.gestion.controller;

import com.nexo.gestion.dto.*;
import com.nexo.gestion.services.PagoService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/pagos")
public class PagoController {

    private final PagoService pagoService;

    public PagoController(PagoService pagoService) {
        this.pagoService = pagoService;
    }

    @PreAuthorize("hasAnyRole('ADMIN','EMPLEADO')")
    @PostMapping
    public ResponseEntity<PagoDTO> altaPago(@RequestBody PagoCreateDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(pagoService.crearPago(dto));
    }


    @PreAuthorize("hasAnyRole('ADMIN','EMPLEADO')")
    @GetMapping
    public ResponseEntity<List<PagoDTO>> mostrarPagos() {
        return ResponseEntity.ok(pagoService.buscarPagos());
    }

    @PreAuthorize("hasAnyRole('ADMIN','EMPLEADO')")
    @GetMapping("/{id}")
    public ResponseEntity<PagoDTO> obtenerPago(@PathVariable Integer id) {
        return ResponseEntity.ok(pagoService.obtenerPago(id));
    }

    @PreAuthorize("hasAnyRole('ADMIN')")
    @PatchMapping("/{id}/anular")
    public ResponseEntity<Void> anularPago(@PathVariable Integer id) {
        pagoService.anularPago(id);
        return ResponseEntity.noContent().build();
    }

    @PreAuthorize("hasAnyRole('ADMIN')")
    @GetMapping("/estadisticas/recaudado-por-dia")
    public ResponseEntity<List<PagoPorFechaDTO>> totalRecaudadoPorDia(){
        return ResponseEntity.ok(pagoService.recaudadoPorDia());
    }

    @PreAuthorize("hasAnyRole('ADMIN')")
    @GetMapping("/estadisticas/recaudado-ultima-semana")
    public ResponseEntity<List<PagoPorFechaDTO>> totalRecaudadoUltimaSemana(){
        return ResponseEntity.ok(pagoService.recaudadoUltimaSemana());
    }

    @PreAuthorize("hasAnyRole('ADMIN')")
    @GetMapping("/estadisticas/recaudado-meses")
    public ResponseEntity<List<PagoPorMesDTO>> totalRecaudadoMeses(){
        return ResponseEntity.ok(pagoService.recaudadoMeses());
    }

    @PreAuthorize("hasAnyRole('ADMIN')")
    @GetMapping("/estadisticas/recaudado-hoy")
    public ResponseEntity<BigDecimal> totalRecaudadoHoy(){
        return ResponseEntity.ok(pagoService.recaudadoHoy());
    }

    @PreAuthorize("hasAnyRole('ADMIN')")
    @GetMapping("/estadisticas/recaudado-semana")
    public ResponseEntity<BigDecimal> totalRecaudadoSemana(){
        return ResponseEntity.ok(pagoService.recaudadoSemana());
    }

    @PreAuthorize("hasAnyRole('ADMIN')")
    @GetMapping("/estadisticas/recaudado-mes")
    public ResponseEntity<BigDecimal> totalRecaudadoMes(){
        return ResponseEntity.ok(pagoService.recaudadoMes());
    }

    @PreAuthorize("hasAnyRole('ADMIN')")
    @GetMapping("/estadisticas/recaudado-productos-planes")
    public ResponseEntity<RecaudacionProductosMembresiasMesDTO> totalRecaudadoProductosPlanes(){
        return ResponseEntity.ok(pagoService.recaudadoMesProductosPlanes());
    }

    @PreAuthorize("hasAnyRole('ADMIN')")
    @GetMapping("/estadisticas/producto-mas-vendido-mes")
    public ResponseEntity<ProductoMasVendidoMesDTO> productoMasVendidoMes(){
        return ResponseEntity.ok(pagoService.productoMasVendidoEnELMes());
    }

    @PreAuthorize("hasAnyRole('ADMIN')")
    @GetMapping("/estadisticas/plan-mas-vendido-mes")
    public ResponseEntity<PlanMasVendidoMesDTO> planMasVendidoMes(){
        return ResponseEntity.ok(pagoService.planMasVendidoEnELMes());
    }



}

