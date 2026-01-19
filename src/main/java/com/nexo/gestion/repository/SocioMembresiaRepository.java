package com.nexo.gestion.repository;

import com.nexo.gestion.entity.SocioMembresia;
import jakarta.validation.constraints.NotBlank;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface SocioMembresiaRepository extends JpaRepository<SocioMembresia, Integer> {
    @Query("""
SELECT MAX(sm.fechaHasta)
FROM SocioMembresia sm
WHERE sm.socio.dni = :dni
AND sm.fechaHasta >= CURRENT_DATE
""")
    LocalDate findUltimoVencimientoVigente(String dni);

    @Query(value = """
    SELECT *
    FROM socio_membresia sm
    WHERE sm.dni_socio = :dni
      AND sm.activo = true
      AND CURRENT_DATE BETWEEN sm.fecha_inicio AND sm.fecha_hasta
    ORDER BY sm.fecha_inicio DESC
    LIMIT 1
""", nativeQuery = true)
    Optional<SocioMembresia> findActivaBySocio(String dni);


    @Query("""
SELECT MAX(sm.fechaHasta)
FROM SocioMembresia sm
WHERE sm.socio.dni = :dni
AND sm.fechaHasta >= CURRENT_DATE
""")
    LocalDate findUltimoVencimiento(String dni);


    List<SocioMembresia> findBySocioDniOrderByFechaInicioAsc(@NotBlank String dni);
}
