package com.nexo.gestion.repository;

import com.nexo.gestion.entity.Asistencia;
import com.nexo.gestion.entity.AsistenciaSocioId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.security.core.parameters.P;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.List;
import java.util.Map;

public interface AsistenciaRepository extends JpaRepository<Asistencia, AsistenciaSocioId> {
    @Query("""
    SELECT a FROM Asistencia a
    JOIN a.socio s
    WHERE (LOWER(s.nombre) LIKE :q OR s.dni LIKE :q)
    ORDER BY a.idAsistencia.fechaHora DESC
    """)
    List<Asistencia> buscarPorNombreODni(@Param("q") String q);

    @Query("""
    SELECT a FROM Asistencia a
    JOIN a.socio s
    WHERE (:q IS NULL OR LOWER(s.nombre) LIKE :q OR s.dni LIKE :q)
      AND a.idAsistencia.fechaHora >= :desde
      AND a.idAsistencia.fechaHora <= :hasta
    ORDER BY a.idAsistencia.fechaHora DESC
    """)
    org.springframework.data.domain.Page<Asistencia> buscarAsistenciasPaginadas(
            @Param("q") String q,
            @Param("desde") LocalDateTime desde,
            @Param("hasta") LocalDateTime hasta,
            org.springframework.data.domain.Pageable pageable
    );


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

    @Query(value = """
            SELECT COUNT(*) FROM asistencia A
            WHERE A.estado_asistencia = 'PENDIENTE' and A.DNI = :dni
            """, nativeQuery = true)
    Integer asistenciasPendientesSocio(@Param("dni") String dni);

    @Query(value = """
            SELECT A.FECHA_HORA FROM asistencia A
            WHERE A.estado_asistencia = 'PENDIENTE' and A.DNI = :dni
            ORDER BY A.FECHA_HORA ASC
            LIMIT 1
            """, nativeQuery = true)
    java.time.Instant fechaPrimeraAsistenciasPendiente(@Param("dni") String dni);

    @Query("""
    SELECT a
    FROM Asistencia a
    WHERE a.socio.dni = :dni
      AND a.estadoAsistencia = com.nexo.gestion.entity.EstadoAsistencia.PENDIENTE
      AND a.idAsistencia.fechaHora BETWEEN :inicio AND :fin
""")
    List<Asistencia> findPendientesEnRango(
            @Param("dni") String dni,
            @Param("inicio") java.time.LocalDateTime inicio,
            @Param("fin") java.time.LocalDateTime fin
    );

    // Hora pico: contar asistencias por hora del día (mes actual)
    @Query(value = """
        SELECT EXTRACT(HOUR FROM a.fecha_hora) as hora, COUNT(*) as total
        FROM asistencia a
        WHERE EXTRACT(MONTH FROM a.fecha_hora) = EXTRACT(MONTH FROM CURRENT_DATE)
          AND EXTRACT(YEAR FROM a.fecha_hora) = EXTRACT(YEAR FROM CURRENT_DATE)
        GROUP BY EXTRACT(HOUR FROM a.fecha_hora)
        ORDER BY total DESC
        """, nativeQuery = true)
    List<Object[]> asistenciasPorHora();

    @Query(value = """
            SELECT COUNT(*) FROM asistencia a
            WHERE a.fecha_hora >= date_trunc('month', CURRENT_DATE - INTERVAL '1 month')
              AND a.fecha_hora < date_trunc('month', CURRENT_DATE)
            """, nativeQuery = true)
    Integer asistenciasTotalMesAnterior();

    // Primera asistencia pendiente dentro de un rango de fechas
    @Query(value = """
            SELECT a.fecha_hora FROM asistencia a
            WHERE a.estado_asistencia = 'PENDIENTE' 
              AND a.dni = :dni
              AND a.fecha_hora >= CAST(:limiteInferior AS DATE)
            ORDER BY a.fecha_hora ASC
            LIMIT 1
            """, nativeQuery = true)
    java.time.Instant fechaPrimeraAsistenciaPendienteDentroDeRango(
            @Param("dni") String dni, 
            @Param("limiteInferior") LocalDate limiteInferior);

    // Contar asistencias de HOY
    @Query(value = """
            SELECT COUNT(*) FROM asistencia a
            WHERE a.fecha_hora::date = CURRENT_DATE
            """, nativeQuery = true)
    Integer contarAsistenciasHoy();

}




