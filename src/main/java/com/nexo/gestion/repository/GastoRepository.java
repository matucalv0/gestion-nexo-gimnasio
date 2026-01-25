package com.nexo.gestion.repository;

import com.nexo.gestion.entity.Gasto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.math.BigDecimal;
import java.util.List;

public interface GastoRepository extends JpaRepository<Gasto, Integer> {
    List<Gasto> findAllByOrderByFechaDesc();

    @Query(value = """
            SELECT COALESCE(SUM(g.monto), 0)
            FROM gasto g
            WHERE g.fecha >= date_trunc('month', CURRENT_DATE)
            AND g.fecha <  date_trunc('month', CURRENT_DATE) + INTERVAL '1 month';
            """, nativeQuery = true)

    BigDecimal totalGastadoMes();

    @Query(value = """
            SELECT SUM(G.MONTO) FROM GASTO G\s
            WHERE G.FECHA::DATE = CURRENT_DATE
            """, nativeQuery = true)

    BigDecimal totalGastadoHoy();

    @Query(value = """
            SELECT SUM(g.monto)
            FROM gasto g
            WHERE g.fecha >= date_trunc('week', CURRENT_DATE)
             AND g.fecha <  (date_trunc('week', CURRENT_DATE) + INTERVAL '1 week')
            
            """, nativeQuery = true)

    BigDecimal totalGastadoSemana();

    @Query(value = "SELECT g.fecha, SUM(g.monto) FROM gasto g WHERE g.fecha >= CURRENT_DATE - INTERVAL '7' DAY GROUP BY g.fecha ORDER BY g.fecha ASC", nativeQuery = true)
    List<Object[]> totalGastosUltimaSemana();

    @Query(value = """
        SELECT EXTRACT(YEAR FROM g.fecha) AS anio,
               EXTRACT(MONTH FROM g.fecha) AS mes,
               SUM(g.monto) AS total
        FROM gasto g
        GROUP BY EXTRACT(YEAR FROM g.fecha), EXTRACT(MONTH FROM g.fecha)
        ORDER BY anio ASC, mes ASC
        """, nativeQuery = true)
    List<Object[]> totalGastosPorMes();
}
