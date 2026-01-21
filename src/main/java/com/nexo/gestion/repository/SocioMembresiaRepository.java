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


    @Query(value = """
            SELECT SM.FECHA_HASTA - CURRENT_DATE FROM SOCIO_MEMBRESIA SM
            WHERE SM.ID_SM = :id_sm  AND SM.DNI_SOCIO = :dni
            """, nativeQuery = true)

    Integer cantidadDiasParaVencimiento(@Param("dni") String dni, @Param("id_sm") Integer idMembresiaVigente);

    @Query(value = """
        SELECT COUNT(DISTINCT sm.dni_socio)
        FROM socio_membresia sm
        WHERE sm.fecha_inicio <  CURRENT_DATE + INTERVAL '1 day'
          AND (sm.fecha_hasta IS NULL\s
               OR sm.fecha_hasta >= date_trunc('month', CURRENT_DATE));
        
        """, nativeQuery = true)

    Integer sociosActivosEnElMesActual();

    @Query(value = """
        SELECT EXISTS (
            SELECT 1
            FROM socio_membresia sm
            WHERE sm.dni_socio = :dni
              AND sm.fecha_inicio < CURRENT_DATE + INTERVAL '1 day'
              AND (sm.fecha_hasta IS NULL
                   OR sm.fecha_hasta >= date_trunc('month', CURRENT_DATE))
        )
        """, nativeQuery = true)
    Boolean estaActivoEnElMesActual(@Param("dni") String dni);


}
