package com.nexo.gestion.repository;

import com.nexo.gestion.dto.PagoPorFechaDTO;
import com.nexo.gestion.dto.PlanMasVendidoMesDTO;
import com.nexo.gestion.dto.ProductoMasVendidoMesDTO;
import com.nexo.gestion.entity.Pago;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

public interface PagoRepository extends JpaRepository<Pago, Integer> {
    @Query(value = "SELECT SUM(D.SUBTOTAL) FROM DETALLE_PAGO D WHERE D.ID_PAGO = :idPago",  nativeQuery = true)
    BigDecimal sumarSubtotales(@Param("idPago") Integer id_pago);
    @Query(value = "SELECT * FROM PAGO P WHERE P.DNI_SOCIO = :dni", nativeQuery = true)
    List<Pago> buscarPagosPorSocio(@Param("dni") String dni);
    @Query("SELECT new com.nexo.gestion.dto.PagoPorFechaDTO(p.fecha, SUM(p.monto)) " +
            "FROM Pago p " +
            "GROUP BY p.fecha " +
            "ORDER BY p.fecha ASC")
    List<PagoPorFechaDTO> totalPagosPorFecha();

    @Query(value = "SELECT p.fecha, SUM(p.monto) FROM pago p WHERE p.fecha >= CURRENT_DATE - INTERVAL '7' DAY GROUP BY p.fecha ORDER BY p.fecha ASC", nativeQuery = true)
    List<Object[]> totalPagosUltimaSemana();

    @Query(value = """
        SELECT EXTRACT(YEAR FROM p.fecha) AS anio,
               EXTRACT(MONTH FROM p.fecha) AS mes,
               SUM(p.monto) AS total
        FROM pago p
        GROUP BY EXTRACT(YEAR FROM p.fecha), EXTRACT(MONTH FROM p.fecha)
        ORDER BY anio ASC, mes ASC
        """, nativeQuery = true)
    List<Object[]> totalPagosPorMes();

    @Query(value = """
            SELECT SUM(P.MONTO) FROM PAGO P\s
            WHERE P.FECHA = CURRENT_DATE
            """, nativeQuery = true)

    BigDecimal totalRecaudadoHoy();

    @Query(value = """
            SELECT SUM(p.monto)
            FROM pago p
            WHERE p.fecha >= date_trunc('week', CURRENT_DATE)::date
             AND p.fecha <  (date_trunc('week', CURRENT_DATE) + INTERVAL '1 week')::date
            
            """, nativeQuery = true)

    BigDecimal totalRecaudadoSemana();

    @Query(value = """
            SELECT SUM(p.monto)
            FROM pago p
            WHERE p.fecha >= date_trunc('month', CURRENT_DATE)::date
              AND p.fecha <  (date_trunc('month', CURRENT_DATE) + INTERVAL '1 month')::date;
            """, nativeQuery = true)

    BigDecimal totalRecaudadoMes();

    @Query(value = """
            SELECT SUM(d.cantidad * d.precio_unitario)
            FROM detalle_pago d
            JOIN pago p ON p.id_pago = d.id_pago
            WHERE d.id_producto IS NOT NULL
              AND p.fecha >= date_trunc('month', CURRENT_DATE)
              AND p.fecha <  date_trunc('month', CURRENT_DATE) + INTERVAL '1 month';
            """, nativeQuery = true)

    BigDecimal totalRecaudadoMesProductos();

    @Query(value = """
            SELECT SUM(d.cantidad * d.precio_unitario)
            FROM detalle_pago d
            JOIN pago p ON p.id_pago = d.id_pago
            WHERE d.id_sm IS NOT NULL
              AND p.fecha >= date_trunc('month', CURRENT_DATE)
              AND p.fecha <  date_trunc('month', CURRENT_DATE) + INTERVAL '1 month';
            """, nativeQuery = true)
    BigDecimal totalRecaudadoMesPlanes();


    List<Pago> findAllByOrderByFechaDesc();

    @Query(value = """
            SELECT
              PR.nombre,
              COUNT(*) AS total_vendidos
            FROM pago P
            JOIN detalle_pago DP ON P.id_pago = DP.id_pago
            JOIN producto PR ON DP.id_producto = PR.id_producto
            WHERE DP.id_sm IS NULL
              AND P.fecha >= date_trunc('month', CURRENT_DATE)
              AND P.fecha <  date_trunc('month', CURRENT_DATE) + INTERVAL '1 month'
            GROUP BY PR.nombre
            ORDER BY total_vendidos DESC
            LIMIT 1;
            """, nativeQuery = true)
    List<Object[]> productoMasVendidoEnELMes();

    @Query(value = """
            SELECT
              m.nombre,
              COUNT(*) AS total_vendidos
            FROM pago P
            JOIN detalle_pago DP ON P.id_pago = DP.id_pago
            JOIN socio_membresia sm ON DP.id_sm = sm.id_sm
            JOIN membresia m ON sm.id_membresia = m.id_membresia
            WHERE DP.id_producto IS NULL
              AND P.fecha >= date_trunc('month', CURRENT_DATE)
              AND P.fecha <  date_trunc('month', CURRENT_DATE) + INTERVAL '1 month'
            GROUP BY m.nombre
            ORDER BY total_vendidos DESC
            LIMIT 1;
            """, nativeQuery = true)

    List<Object[]> planMasVendidoMensual();

    @Query(value = """
            SELECT COALESCE(COUNT(*), 0)
                        FROM pago p
                        WHERE p.fecha >= date_trunc('month', CURRENT_DATE)
                        AND p.fecha <  date_trunc('month', CURRENT_DATE) + INTERVAL '1 month'
            """, nativeQuery = true)
    Integer cantidadPagosMesActual();




}
