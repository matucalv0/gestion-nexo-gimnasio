package com.nexo.gestion.repository;

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
}
