package com.nexo.gestion.controller;

import com.nexo.gestion.dto.*;
import com.nexo.gestion.services.SocioService;
import com.nexo.gestion.services.PagoService;
import com.nexo.gestion.services.FinanzaService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

@RestController
@RequestMapping("/exportar")
public class ExportController {

    private final SocioService socioService;
    private final PagoService pagoService;
    private final FinanzaService finanzaService;

    public ExportController(SocioService socioService, PagoService pagoService, FinanzaService finanzaService) {
        this.socioService = socioService;
        this.pagoService = pagoService;
        this.finanzaService = finanzaService;
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping(value = "/socios", produces = "text/csv")
    public ResponseEntity<String> exportarSocios(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) Boolean activo) {

        // Obtener todos los socios usando endpoint básico
        PageResponseDTO<SocioDTO> socios = socioService.buscarSociosPaginados(0, 10000, q, activo);

        StringBuilder csv = new StringBuilder();
        csv.append("DNI,Nombre,Telefono,Email,Fecha_Nacimiento\n");

        for (SocioDTO s : socios.content()) {
            csv.append(escapeCsv(s.dni())).append(",");
            csv.append(escapeCsv(s.nombre())).append(",");
            csv.append(escapeCsv(s.telefono())).append(",");
            csv.append(escapeCsv(s.email())).append(",");
            csv.append(s.fechaNacimiento() != null ? s.fechaNacimiento().toString() : "");
            csv.append("\n");
        }

        String filename = "socios_" + LocalDate.now().format(DateTimeFormatter.ISO_DATE) + ".csv";

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + filename)
                .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .body("\uFEFF" + csv); // BOM para Excel
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping(value = "/pagos", produces = "text/csv")
    public ResponseEntity<String> exportarPagos(
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) LocalDate hasta) {

        if (hasta == null) hasta = LocalDate.now();
        if (desde == null) desde = hasta.minusMonths(1);

        PageResponseDTO<PagoDTO> pagos = pagoService.buscarPagosPaginados(0, 10000, desde, hasta);

        StringBuilder csv = new StringBuilder();
        csv.append("ID,Fecha,Monto,Estado,Detalles\n");

        for (PagoDTO p : pagos.content()) {
            csv.append(p.idPago()).append(",");
            csv.append(p.fecha() != null ? p.fecha().toString() : "").append(",");
            csv.append(p.monto()).append(",");
            csv.append(p.estado()).append(",");

            // Concatenar detalles
            StringBuilder detalles = new StringBuilder();
            if (p.detalles() != null) {
                for (DetallePagoDTO d : p.detalles()) {
                    if (!detalles.isEmpty()) detalles.append(" | ");
                    detalles.append(d.tipo()).append(": ").append(d.nombre())
                            .append(" x").append(d.cantidad())
                            .append(" $").append(d.precioUnitario());
                }
            }
            csv.append(escapeCsv(detalles.toString()));
            csv.append("\n");
        }

        String filename = "pagos_" + desde + "_a_" + hasta + ".csv";

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + filename)
                .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .body("\uFEFF" + csv);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping(value = "/movimientos", produces = "text/csv")
    public ResponseEntity<String> exportarMovimientos(
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) LocalDate hasta) {

        if (hasta == null) hasta = LocalDate.now();
        if (desde == null) desde = hasta.minusMonths(1);

        PageResponseDTO<MovimientoFinancieroDTO> movimientos = finanzaService.buscarMovimientosPaginados(0, 10000, desde, hasta);

        StringBuilder csv = new StringBuilder();
        csv.append("Fecha,Tipo,Monto,Categoria,Proveedor\n");

        for (MovimientoFinancieroDTO m : movimientos.content()) {
            csv.append(m.fecha() != null ? m.fecha().toLocalDate().toString() : "").append(",");
            csv.append(m.tipoMovimiento()).append(",");
            csv.append(m.monto()).append(",");
            csv.append(m.categoria() != null ? m.categoria().toString() : "").append(",");
            csv.append(escapeCsv(m.proveedor()));
            csv.append("\n");
        }

        String filename = "movimientos_" + desde + "_a_" + hasta + ".csv";

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + filename)
                .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .body("\uFEFF" + csv);
    }

    private String escapeCsv(String value) {
        if (value == null) return "";
        if (value.contains(",") || value.contains("\"") || value.contains("\n")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        return value;
    }
}

