package com.nexo.gestion.services;

import com.nexo.gestion.dto.*;
import com.nexo.gestion.entity.*;
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
    @jakarta.persistence.PersistenceContext
    private jakarta.persistence.EntityManager entityManager;
    private final GastoRepository gastoRepository;
    private final PagoRepository pagoRepository;

    public FinanzaService(GastoRepository gastoRepository, PagoRepository pagoRepository){
        this.gastoRepository = gastoRepository;
        this.pagoRepository = pagoRepository;
    }

    public PageResponseDTO<MovimientoFinancieroDTO> buscarMovimientosPaginados(int page, int size, LocalDate desde, LocalDate hasta) {
        if (hasta == null) hasta = LocalDate.now();
        if (desde == null) desde = LocalDate.of(1970, 1, 1);

        int offset = page * size;


        String sql = """
            SELECT * FROM (
                SELECT id_pago as ref_id, 'INGRESO' as tipo, monto, fecha, CAST('Pago' AS VARCHAR) as cat, CAST(NULL AS VARCHAR) as prov FROM pago WHERE estado NOT IN ('ELIMINADO', 'ANULADO')
                UNION ALL
                SELECT id_gasto as ref_id, 'EGRESO' as tipo, monto, fecha, CAST(categoria AS VARCHAR) as cat, proveedor as prov FROM gasto WHERE (activo IS NULL OR activo = true)
            ) as movimientos
            WHERE fecha >= :desde AND fecha <= :hasta
            ORDER BY fecha DESC
            LIMIT :limit OFFSET :offset
            """;

        String countSql = """
            SELECT COUNT(*) FROM (
                SELECT fecha FROM pago WHERE estado NOT IN ('ELIMINADO', 'ANULADO')
                UNION ALL
                SELECT fecha FROM gasto WHERE (activo IS NULL OR activo = true)
            ) as movimientos
            WHERE fecha >= :desde AND fecha <= :hasta
            """;


        jakarta.persistence.Query query = entityManager.createNativeQuery(sql);
        query.setParameter("desde", java.sql.Date.valueOf(desde));
        query.setParameter("hasta", java.sql.Date.valueOf(hasta));
        query.setParameter("limit", size);
        query.setParameter("offset", offset);

        List<Object[]> rows = query.getResultList();
        List<MovimientoFinancieroDTO> content = new ArrayList<>();

        for (Object[] row : rows) {
            Integer refId = ((Number) row[0]).intValue();
            String tipoStr = (String) row[1];
            BigDecimal monto = (BigDecimal) row[2];
            

            LocalDate fecha;
            if (row[3] instanceof java.sql.Timestamp) {
                fecha = ((java.sql.Timestamp) row[3]).toLocalDateTime().toLocalDate();
            } else {
                fecha = ((java.sql.Date) row[3]).toLocalDate();
            }

            String categoriaStr = (String) row[4];
            String proveedorRaw = (String) row[5];

            TipoMovimiento tipo = TipoMovimiento.valueOf(tipoStr);
            

            com.nexo.gestion.entity.CategoriaGasto categoriaEnum = null;
            String proveedor = null;
            
            if (tipo == TipoMovimiento.EGRESO) {
                if (categoriaStr != null) {
                    try {
                        categoriaEnum = com.nexo.gestion.entity.CategoriaGasto.valueOf(categoriaStr);
                    } catch (IllegalArgumentException e) {

                    }
                }
                proveedor = proveedorRaw;
            }

            content.add(new MovimientoFinancieroDTO(
                    tipo,
                    monto,
                    fecha.atStartOfDay(),
                    refId,
                    categoriaEnum,
                    proveedor
            ));
        }

        // Execute Count Query
        jakarta.persistence.Query countQuery = entityManager.createNativeQuery(countSql);
        countQuery.setParameter("desde", java.sql.Date.valueOf(desde));
        countQuery.setParameter("hasta", java.sql.Date.valueOf(hasta));
        
        long totalElements = ((Number) countQuery.getSingleResult()).longValue();
        int totalPages = (int) Math.ceil((double) totalElements / size);

        return new PageResponseDTO<>(
                content,
                page,
                size,
                totalElements,
                totalPages
        );
    }

    public List<MovimientoFinancieroDTO> buscarMovimientos(){
        List<Pago> pagos = pagoRepository.findByEstadoNotInOrderByFechaDesc(
                List.of(EstadoPago.ELIMINADO, EstadoPago.ANULADO));
        List<Gasto> gastos = gastoRepository.findByActivoTrueOrderByFechaDesc();

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

    public FinanzaMesStatsDTO obtenerEstadisticasMensuales() {
        // Ganancia actual
        BigDecimal ingresosMesActual = pagoRepository.totalRecaudadoMes();
        BigDecimal egresosMesActual = gastoRepository.totalGastadoMes();
        
        if (ingresosMesActual == null) ingresosMesActual = BigDecimal.ZERO;
        if (egresosMesActual == null) egresosMesActual = BigDecimal.ZERO;
        
        BigDecimal gananciaMesActual = ingresosMesActual.subtract(egresosMesActual);

        // Ganancia mes anterior
        List<BalancePorMesDTO> historico = obtenerBalanceMeses();
        
        LocalDate fechaActual = LocalDate.now();
        int mesActual = fechaActual.getMonthValue();
        int anioActual = fechaActual.getYear();
        
        int mesAnterior = mesActual - 1;
        int anioAnterior = anioActual;
        if (mesAnterior == 0) {
            mesAnterior = 12;
            anioAnterior--;
        }

        final int finalMesAnterior = mesAnterior;
        final int finalAnioAnterior = anioAnterior;
        
        BalancePorMesDTO balanceAnterior = historico.stream()
            .filter(h -> h.mes().equals(finalMesAnterior) && h.anio().equals(finalAnioAnterior))
            .findFirst()
            .orElse(null);
            
        BigDecimal gananciaMesAnterior = BigDecimal.ZERO;
        if (balanceAnterior != null) {
            gananciaMesAnterior = balanceAnterior.ingresos().subtract(balanceAnterior.egresos());
        }

        Double variacion = null;

        // Lógica de variación permitiendo > 100% y manejando negativos
        // Si el mes anterior fue 0, y el actual != 0, crecimiento "infinito"
        if (gananciaMesAnterior.compareTo(BigDecimal.ZERO) != 0) {
            BigDecimal diferencia = gananciaMesActual.subtract(gananciaMesAnterior);
            // Usamos valor absoluto del denominador para mantener el signo correcto de la variación
            BigDecimal var = diferencia.divide(gananciaMesAnterior.abs(), 4, java.math.RoundingMode.HALF_UP)
                                       .multiply(BigDecimal.valueOf(100));
            variacion = var.doubleValue();
        } else if (gananciaMesActual.compareTo(BigDecimal.ZERO) != 0) {
            // Anterior 0, Actual != 0 -> 100% (o mantener lógica de 'infinito')
             variacion = 100.0;
        } else {
            // 0 vs 0
            variacion = 0.0;
        }

        return new FinanzaMesStatsDTO(gananciaMesActual, variacion);
    }

    public DistribucionFinanzasDTO distribucionFinanzasMensual() {
        BigDecimal gastos = gastoRepository.totalGastadoMes();
        BigDecimal pagos = pagoRepository.totalRecaudadoMes();

        return new DistribucionFinanzasDTO(pagos, gastos);
    }
}
