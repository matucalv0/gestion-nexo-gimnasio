package com.nexo.gestion.services;

import com.nexo.gestion.dto.*;
import com.nexo.gestion.entity.DetallePago;
import com.nexo.gestion.entity.Gasto;
import com.nexo.gestion.entity.Pago;
import com.nexo.gestion.repository.GastoRepository;
import com.nexo.gestion.repository.PagoRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class FinanzaService {
    private final GastoRepository gastoRepository;
    private final PagoRepository pagoRepository;

    public FinanzaService(GastoRepository gastoRepository, PagoRepository pagoRepository){
        this.gastoRepository = gastoRepository;
        this.pagoRepository = pagoRepository;
    }

    public List<MovimientoFinancieroDTO> buscarMovimientos(){
        List<Pago> pagos = pagoRepository.findAllByOrderByFechaDesc();
        List<Gasto> gastos = gastoRepository.findAllByOrderByFechaDesc();

        List<MovimientoFinancieroDTO> movimientos = new ArrayList<>();

        for (Pago p: pagos){
            movimientos.add(new MovimientoFinancieroDTO(TipoMovimiento.INGRESO, p.getMonto(), p.getFecha().atStartOfDay(), p.getIdPago()));
        }

        for (Gasto g: gastos){
            movimientos.add(new MovimientoFinancieroDTO(
                TipoMovimiento.EGRESO, 
                g.getMonto(), 
                g.getFecha(), 
                g.getIdGasto(),
                g.getCategoria(),
                g.getProveedor()
            ));
        }

        movimientos.sort(Comparator.comparing(MovimientoFinancieroDTO::fecha).reversed());

        return movimientos;

    }

    public BigDecimal obtenerGananciaMensual() {
        BigDecimal ingresosMensualRep = pagoRepository.totalRecaudadoMes();
        BigDecimal egresosMensualRep = gastoRepository.totalGastadoMes();

        BigDecimal ingresosMes = ingresosMensualRep != null ? ingresosMensualRep : BigDecimal.ZERO;
        BigDecimal egresosMes = egresosMensualRep != null ? egresosMensualRep : BigDecimal.ZERO;

        return ingresosMes.subtract(egresosMes);
    }

    public BigDecimal obtenerGananciaDeHoy() {
        BigDecimal ingresosHoyRep = pagoRepository.totalRecaudadoHoy();
        BigDecimal egresosHoyRep = gastoRepository.totalGastadoHoy();

        BigDecimal ingresosHoy = ingresosHoyRep != null ? ingresosHoyRep : BigDecimal.ZERO;
        BigDecimal egresosHoy = egresosHoyRep != null ? egresosHoyRep : BigDecimal.ZERO;

        return ingresosHoy.subtract(egresosHoy);
    }

    public BigDecimal obtenerGananciaSemanal() {
        BigDecimal ingresosSemanaRep = pagoRepository.totalRecaudadoSemana();
        BigDecimal egresosSemanaRep = gastoRepository.totalGastadoSemana();

        BigDecimal ingresosSemana = ingresosSemanaRep != null ? ingresosSemanaRep : BigDecimal.ZERO;
        BigDecimal egresosSemana = egresosSemanaRep != null ? egresosSemanaRep : BigDecimal.ZERO;

        return ingresosSemana.subtract(egresosSemana);
    }

    public List<BalancePorFechaDTO> obtenerBalanceSemana() {
        List<Object[]> egresos = gastoRepository.totalGastosUltimaSemana();
        List<Object[]> ingresos = pagoRepository.totalPagosUltimaSemana();

        Map<LocalDate, BigDecimal> egresosPorFecha = new HashMap<>();
        Map<LocalDate, BigDecimal> ingresosPorFecha = new HashMap<>();

        for (Object[] g : egresos) {
            LocalDate fecha = ((java.sql.Timestamp) g[0]).toLocalDateTime().toLocalDate();
            BigDecimal monto = (BigDecimal) g[1];
            egresosPorFecha.put(fecha, monto);
        }

        for (Object[] i : ingresos) {
            LocalDate fecha = ((java.sql.Date) i[0]).toLocalDate();
            BigDecimal monto = (BigDecimal) i[1];
            ingresosPorFecha.put(fecha, monto);
        }

        Set<LocalDate> fechas = new TreeSet<>();
        fechas.addAll(egresosPorFecha.keySet());
        fechas.addAll(ingresosPorFecha.keySet());

        List<BalancePorFechaDTO> balances = new ArrayList<>();

        for (LocalDate fecha : fechas) {
            balances.add(
                    new BalancePorFechaDTO(
                            fecha,
                            ingresosPorFecha.getOrDefault(fecha, BigDecimal.ZERO),
                            egresosPorFecha.getOrDefault(fecha, BigDecimal.ZERO)
                    )
            );
        }

        return balances;

    }


    public List<BalancePorMesDTO> obtenerBalanceMeses() {

        List<Object[]> egresos = gastoRepository.totalGastosPorMes();
        List<Object[]> ingresos = pagoRepository.totalPagosPorMes();

        Map<String, BigDecimal> egresosMap = new HashMap<>();
        Map<String, BigDecimal> ingresosMap = new HashMap<>();

        // egresos
        for (Object[] row : egresos) {
            Integer anio = ((Number) row[0]).intValue();
            Integer mes  = ((Number) row[1]).intValue();
            BigDecimal total = (BigDecimal) row[2];

            egresosMap.put(anio + "-" + mes, total);
        }

        // ingresos
        for (Object[] row : ingresos) {
            Integer anio = ((Number) row[0]).intValue();
            Integer mes  = ((Number) row[1]).intValue();
            BigDecimal total = (BigDecimal) row[2];

            ingresosMap.put(anio + "-" + mes, total);
        }

        // unir claves
        Set<String> claves = new TreeSet<>();
        claves.addAll(egresosMap.keySet());
        claves.addAll(ingresosMap.keySet());

        List<BalancePorMesDTO> balances = new ArrayList<>();

        for (String clave : claves) {
            String[] partes = clave.split("-");
            Integer anio = Integer.parseInt(partes[0]);
            Integer mes  = Integer.parseInt(partes[1]);

            balances.add(
                    new BalancePorMesDTO(
                            anio,
                            mes,
                            ingresosMap.getOrDefault(clave, BigDecimal.ZERO),
                            egresosMap.getOrDefault(clave, BigDecimal.ZERO)
                    )
            );
        }

        return balances;
    }

    public DistribucionFinanzasDTO distribucionFinanzasMensual() {
        BigDecimal gastos = gastoRepository.totalGastadoMes();
        BigDecimal pagos = pagoRepository.totalRecaudadoMes();

        return new DistribucionFinanzasDTO(pagos, gastos);
    }
}
