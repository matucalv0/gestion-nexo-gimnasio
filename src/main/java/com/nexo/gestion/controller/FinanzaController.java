package com.nexo.gestion.controller;

import com.nexo.gestion.dto.*;
import com.nexo.gestion.services.FinanzaService;
import com.nexo.gestion.services.GastoService;
import com.nexo.gestion.services.PagoService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/finanzas")
public class FinanzaController {
    private final FinanzaService finanzaService;

    public FinanzaController(FinanzaService finanzaService){
        this.finanzaService = finanzaService;

    }

    @PreAuthorize("hasAnyRole('ADMIN','EMPLEADO')")
    @GetMapping
    public ResponseEntity<PageResponseDTO<MovimientoFinancieroDTO>> mostrarMovimientos(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate desde,
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate hasta
    ){
        return ResponseEntity.ok(finanzaService.buscarMovimientosPaginados(page, size, desde, hasta));

    }

    @PreAuthorize("hasAnyRole('ADMIN','EMPLEADO')")
    @GetMapping("/ganancias-mes")
    public ResponseEntity<BigDecimal> gananciaMensual(){
        return ResponseEntity.ok(finanzaService.obtenerGananciaMensual());
    }

    @PreAuthorize("hasAnyRole('ADMIN','EMPLEADO')")
    @GetMapping("/ganancias-hoy")
    public ResponseEntity<BigDecimal> gananciaDiaria(){
        return ResponseEntity.ok(finanzaService.obtenerGananciaDeHoy());
    }

    @PreAuthorize("hasAnyRole('ADMIN','EMPLEADO')")
    @GetMapping("/ganancias-semana")
    public ResponseEntity<BigDecimal> gananciaSemanal(){
        return ResponseEntity.ok(finanzaService.obtenerGananciaSemanal());
    }

    @PreAuthorize("hasAnyRole('ADMIN','EMPLEADO')")
    @GetMapping("/balance-semanal")
    public ResponseEntity<List<BalancePorFechaDTO>> balanceUltimaSemana(){
        return ResponseEntity.ok(finanzaService.obtenerBalanceSemana());
    }

    @PreAuthorize("hasAnyRole('ADMIN','EMPLEADO')")
    @GetMapping("/balance-mensual")
    public ResponseEntity<List<BalancePorMesDTO>> balanceMeses(){
        return ResponseEntity.ok(finanzaService.obtenerBalanceMeses());
    }

    @PreAuthorize("hasAnyRole('ADMIN','EMPLEADO')")
    @GetMapping("/distribucion-mensual")
    public ResponseEntity<DistribucionFinanzasDTO> distribucionMensual(){
        return ResponseEntity.ok(finanzaService.distribucionFinanzasMensual());
    }

    @PreAuthorize("hasAnyRole('ADMIN','EMPLEADO')")
    @GetMapping("/estadisticas/mes-completo")
    public ResponseEntity<FinanzaMesStatsDTO> estadisticasMesCompleto() {
        return ResponseEntity.ok(finanzaService.obtenerEstadisticasMensuales());
    }

}
