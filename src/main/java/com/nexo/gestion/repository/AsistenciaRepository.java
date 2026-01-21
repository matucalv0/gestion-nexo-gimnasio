package com.nexo.gestion.repository;

import com.nexo.gestion.entity.Asistencia;
import com.nexo.gestion.entity.AsistenciaSocioId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.security.core.parameters.P;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.Map;

public interface AsistenciaRepository extends JpaRepository<Asistencia, AsistenciaSocioId> {
    @Query("""
    SELECT a FROM Asistencia a
    JOIN a.socio s
    WHERE LOWER(s.nombre) LIKE LOWER(CONCAT('%', :q, '%'))
       OR s.dni LIKE CONCAT('%', :q, '%')
    ORDER BY a.idAsistencia.fechaHora DESC
    """)
    List<Asistencia> buscarPorNombreODni(@Param("q") String q);


    @Query(value = "SELECT * FROM ASISTENCIA ORDER BY FECHA_HORA DESC", nativeQuery = true)
    List<Asistencia> findAllOrdenadoPorFecha();


    @Query(value = """
    SELECT EXISTS (
        SELECT 1
        FROM asistencia a
        WHERE a.fecha_hora::date = CURRENT_DATE
          AND a.dni = :dni
    )
    """, nativeQuery = true)
    boolean socioVinoHoy(@Param("dni") String dni);

    @Query(value = """
            SELECT COUNT(*) FROM ASISTENCIA A\s
            WHERE A.DNI = :dni AND
            (a.fecha_hora::date >= date_trunc('week', CURRENT_DATE)::date
            AND a.fecha_hora::date <  (date_trunc('week', CURRENT_DATE) + INTERVAL '1 week')::date)
            """, nativeQuery = true)

    Integer asistenciaSocioEstaSemana(@Param("dni") String dni);

    @Query(value = """
            SELECT COUNT(*) FROM ASISTENCIA A
            WHERE a.fecha_hora::date >= date_trunc('month', CURRENT_DATE)::date
                          AND a.fecha_hora::date <  (date_trunc('month', CURRENT_DATE) + INTERVAL '1 month')::date;
            """, nativeQuery = true)

    Integer asistenciasTotalMes();

    @Query(value = """
            WITH asistencias_por_socio AS (
              SELECT a.dni, COUNT(*) AS total
              FROM asistencia a
              WHERE a.fecha_hora >= date_trunc('month', CURRENT_DATE)
                AND a.fecha_hora <  CURRENT_DATE + INTERVAL '1 day'
              GROUP BY a.dni
            ),
            max_asistencias AS (
              SELECT MAX(total) AS max_total
              FROM asistencias_por_socio
            )
            SELECT\s
              s.*,
              m.max_total AS max_asistencias
            FROM asistencias_por_socio aps
            JOIN socio s ON s.dni = aps.dni
            JOIN max_asistencias m ON aps.total = m.max_total;
            
            """, nativeQuery = true)

    List<Object[]> sociosMasActivosMes();

    @Query(value = """
    SELECT
        d::date AS fecha,
        COUNT(a.dni) AS total
    FROM generate_series(
             date_trunc('month', CAST(:mes AS date)),
             date_trunc('month', CAST(:mes AS date)) + INTERVAL '1 month - 1 day',
             INTERVAL '1 day'
         ) d
    LEFT JOIN asistencia a
           ON a.fecha_hora::date = d::date
    GROUP BY d
    ORDER BY d
    """,
            nativeQuery = true)
    List<Object[]> cantidadAsistenciasPorDiaDelMes(@Param("mes") LocalDate mes);










}
