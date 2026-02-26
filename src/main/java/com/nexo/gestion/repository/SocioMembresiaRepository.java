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
AND sm.activo = true
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
AND sm.activo = true
AND sm.fechaHasta >= CURRENT_DATE
""")
    LocalDate findUltimoVencimiento(String dni);

    @Query("""
    SELECT MAX(sm.fechaHasta)
    FROM SocioMembresia sm
    WHERE sm.socio.dni = :dni AND sm.activo = true
    """)
    LocalDate findUltimoVencimientoGeneral(@Param("dni") String dni);

    List<SocioMembresia> findBySocioDniOrderByFechaInicioAsc(@NotBlank String dni);


    @Query(value = """
            SELECT SM.FECHA_HASTA - CURRENT_DATE FROM SOCIO_MEMBRESIA SM
            WHERE SM.ID_SM = :id_sm  AND SM.DNI_SOCIO = :dni
            """, nativeQuery = true)

    Integer cantidadDiasParaVencimiento(@Param("dni") String dni, @Param("id_sm") Integer idMembresiaVigente);

    @Query(value = """
        SELECT COUNT(DISTINCT sm.dni_socio)
        FROM socio_membresia sm
        WHERE sm.activo = true
          AND sm.fecha_inicio <  date_trunc('month', CURRENT_DATE)
          AND (sm.fecha_hasta IS NULL 
               OR sm.fecha_hasta >= date_trunc('month', CURRENT_DATE - INTERVAL '1 month'));
        
        """, nativeQuery = true)
    Integer sociosActivosMesAnterior();

    @Query(value = """
        SELECT COUNT(DISTINCT sm.dni_socio)
        FROM socio_membresia sm
        WHERE sm.activo = true
          AND sm.fecha_inicio <  CURRENT_DATE + INTERVAL '1 day'
          AND (sm.fecha_hasta IS NULL\s
               OR sm.fecha_hasta >= date_trunc('month', CURRENT_DATE));
        
        """, nativeQuery = true)

    Integer sociosActivosEnElMesActual();

    @Query(value = """
        SELECT EXISTS (
            SELECT 1
            FROM socio_membresia sm
            WHERE sm.dni_socio = :dni
              AND sm.activo = true
              AND sm.fecha_inicio < CURRENT_DATE + INTERVAL '1 day'
              AND (sm.fecha_hasta IS NULL
                   OR sm.fecha_hasta >= date_trunc('month', CURRENT_DATE))
        )
        """, nativeQuery = true)
    Boolean estaActivoEnElMesActual(@Param("dni") String dni);

    @Query(value = """
            SELECT EXISTS (
                SELECT 1
                FROM socio_membresia sm
                WHERE sm.dni_socio = :dni
                  AND sm.activo = true
                  AND sm.fecha_inicio <= CURRENT_DATE
                  AND (
                      sm.fecha_hasta IS NULL
                      OR sm.fecha_hasta >= CURRENT_DATE
                  )
            )
            
            """, nativeQuery = true)
    Boolean estaActivoHoy(@Param("dni") String dni);

    // Verificar si está activo considerando período de gracia
    @Query(value = """
            SELECT EXISTS (
                SELECT 1
                FROM socio_membresia sm
                WHERE sm.dni_socio = :dni
                  AND sm.activo = true
                  AND sm.fecha_inicio <= CURRENT_DATE
                  AND (
                      sm.fecha_hasta IS NULL
                      OR sm.fecha_hasta >= CURRENT_DATE - :diasGracia
                  )
            )
            """, nativeQuery = true)
    Boolean estaActivoConGracia(@Param("dni") String dni, @Param("diasGracia") int diasGracia);

    // Verificar si la membresía está en período de gracia (vencida pero dentro del período)
    @Query(value = """
            SELECT EXISTS (
                SELECT 1
                FROM socio_membresia sm
                WHERE sm.dni_socio = :dni
                  AND sm.activo = true
                  AND sm.fecha_hasta < CURRENT_DATE
                  AND sm.fecha_hasta >= CURRENT_DATE - :diasGracia
            )
            """, nativeQuery = true)
    Boolean estaEnPeriodoGracia(@Param("dni") String dni, @Param("diasGracia") int diasGracia);

    // Socios con membresía activa pero sin asistencias recientes
    @Query(value = """
        SELECT 
            s.dni,
            s.nombre,
            s.telefono,
            COALESCE(CURRENT_DATE - MAX(a.fecha_hora::date), 999) as dias_sin_asistir,
            MAX(a.fecha_hora::date) as ultima_asistencia
        FROM socio s
        INNER JOIN socio_membresia sm ON s.dni = sm.dni_socio
        LEFT JOIN asistencia a ON s.dni = a.dni
        WHERE sm.activo = true
          AND sm.fecha_inicio <= CURRENT_DATE
          AND (sm.fecha_hasta IS NULL OR sm.fecha_hasta >= CURRENT_DATE)
        GROUP BY s.dni, s.nombre, s.telefono
        HAVING COALESCE(CURRENT_DATE - MAX(a.fecha_hora::date), 999) >= :dias
        ORDER BY dias_sin_asistir DESC
        """, nativeQuery = true)
    List<Object[]> sociosActivosSinAsistencia(@Param("dias") Integer dias);

    // Socios con membresía que vence en los próximos N días
    // EXCLUYE socios que ya tienen una membresía futura (ya renovaron)
    @Query(value = """
        SELECT DISTINCT ON (s.dni)
            s.dni,
            s.nombre,
            s.telefono,
            m.nombre as nombre_membresia,
            sm.fecha_hasta,
            (sm.fecha_hasta - CURRENT_DATE) as dias_restantes
        FROM socio s
        INNER JOIN socio_membresia sm ON s.dni = sm.dni_socio
        INNER JOIN membresia m ON sm.id_membresia = m.id_membresia
        WHERE sm.activo = true
          AND sm.fecha_inicio <= CURRENT_DATE
          AND sm.fecha_hasta >= CURRENT_DATE
          AND sm.fecha_hasta <= CURRENT_DATE + :dias
          -- Excluir si ya tiene otra membresía que empieza después de esta
          AND NOT EXISTS (
              SELECT 1 FROM socio_membresia sm2
              WHERE sm2.dni_socio = s.dni
                AND sm2.activo = true
                AND sm2.fecha_inicio > sm.fecha_hasta
          )
        ORDER BY s.dni, sm.fecha_hasta ASC
        """, nativeQuery = true)
    List<Object[]> sociosPorVencerEnDias(@Param("dias") Integer dias);

    // Conteo de socios activos HOY (con membresía vigente)
    @Query(value = """
        SELECT COUNT(DISTINCT sm.dni_socio)
        FROM socio_membresia sm
        WHERE sm.activo = true
          AND sm.fecha_inicio <= CURRENT_DATE
          AND (sm.fecha_hasta IS NULL OR sm.fecha_hasta >= CURRENT_DATE)
        """, nativeQuery = true)
    Integer contarSociosActivosHoy();

    // Batch query: obtener todos los DNIs activos de una lista (evita N+1)
    @Query(value = """
        SELECT DISTINCT sm.dni_socio
        FROM socio_membresia sm
        WHERE sm.dni_socio IN :dnis
          AND sm.activo = true
          AND sm.fecha_inicio < CURRENT_DATE + INTERVAL '1 day'
          AND (sm.fecha_hasta IS NULL
               OR sm.fecha_hasta >= date_trunc('month', CURRENT_DATE))
        """, nativeQuery = true)
    List<String> findDnisActivosEnElMes(@Param("dnis") List<String> dnis);

    @Query(value = """
        SELECT DISTINCT sm.dni_socio
        FROM socio_membresia sm
        WHERE sm.dni_socio IN :dnis
          AND sm.activo = true
          AND sm.fecha_inicio <= CURRENT_DATE
          AND (sm.fecha_hasta IS NULL OR sm.fecha_hasta >= CURRENT_DATE)
        """, nativeQuery = true)
    List<String> findDnisActivosHoy(@Param("dnis") List<String> dnis);

}


