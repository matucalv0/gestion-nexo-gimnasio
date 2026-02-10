package com.nexo.gestion.repository;

import com.nexo.gestion.entity.Gasto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.math.BigDecimal;
import java.util.List;

public interface GastoRepository extends JpaRepository<Gasto, Integer> {
    List<Gasto> findAllByOrderByFechaDesc();
    List<Gasto> findByActivoTrueOrderByFechaDesc();

    @Query(value = """
            SELECT COALESCE(SUM(g.monto), 0)
            FROM gasto g
            WHERE g.fecha >= date_trunc('month', CURRENT_DATE)
            AND g.fecha <  date_trunc('month', CURRENT_DATE) + INTERVAL '1 month'
            AND (g.activo IS NULL OR g.activo = true)
            """, nativeQuery = true)

    BigDecimal totalGastadoMes();

    @Query(value = """
            SELECT SUM(G.MONTO) FROM GASTO G
            WHERE G.FECHA::DATE = CURRENT_DATE
            AND (G.ACTIVO IS NULL OR G.ACTIVO = true)
            """, nativeQuery = true)

    BigDecimal totalGastadoHoy();

    @Query(value = """
            SELECT SUM(g.monto)
            FROM gasto g
            WHERE g.fecha >= date_trunc('week', CURRENT_DATE)
             AND g.fecha <  (date_trunc('week', CURRENT_DATE) + INTERVAL '1 week')
             AND (g.activo IS NULL OR g.activo = true)
            """, nativeQuery = true)

    BigDecimal totalGastadoSemana();

    @Query(value = "SELECT g.fecha, SUM(g.monto) FROM gasto g WHERE g.fecha >= CURRENT_DATE - INTERVAL '7' DAY AND (g.activo IS NULL OR g.activo = true) GROUP BY g.fecha ORDER BY g.fecha ASC", nativeQuery = true)
    List<Object[]> totalGastosUltimaSemana();

    @Query(value = """
        SELECT EXTRACT(YEAR FROM g.fecha) AS anio,
               EXTRACT(MONTH FROM g.fecha) AS mes,
               SUM(g.monto) AS total
        FROM gasto g
        WHERE (g.activo IS NULL OR g.activo = true)
        GROUP BY EXTRACT(YEAR FROM g.fecha), EXTRACT(MONTH FROM g.fecha)
        ORDER BY anio ASC, mes ASC
        """, nativeQuery = true)
    List<Object[]> totalGastosPorMes();

}
