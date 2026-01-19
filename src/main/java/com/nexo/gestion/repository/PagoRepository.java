package com.nexo.gestion.repository;

import com.nexo.gestion.dto.PagoPorFechaDTO;
import com.nexo.gestion.entity.Pago;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;

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


}
