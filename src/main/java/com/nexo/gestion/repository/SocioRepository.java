package com.nexo.gestion.repository;

import com.nexo.gestion.dto.MembresiaVigenteDTO;
import com.nexo.gestion.entity.Socio;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface SocioRepository extends JpaRepository<Socio, String> {
    @Query("SELECT s FROM Socio s WHERE (LOWER(s.nombre) LIKE :query OR s.dni LIKE :query)")
    List<Socio> buscarPorNombreODni(@Param("query") String query);

    // Búsqueda de socios ACTIVOS (membresía vigente), ordenados por días restantes (ascendente)
    @Query(value = """
            WITH membresias_activas AS (
                SELECT DISTINCT ON (sm2.dni_socio)
                    sm2.dni_socio,
                    sm2.id_sm,
                    sm2.fecha_hasta,
                    sm2.fecha_inicio
                FROM socio_membresia sm2
                WHERE sm2.activo = true
                  AND CURRENT_DATE BETWEEN sm2.fecha_inicio AND sm2.fecha_hasta
                ORDER BY sm2.dni_socio, sm2.fecha_hasta DESC
            )
            SELECT s.dni, s.activo, s.email, s.fecha_nacimiento, s.nombre, s.telefono
            FROM socio s
            INNER JOIN membresias_activas ma ON ma.dni_socio = s.dni
            WHERE :q IS NULL OR LOWER(s.nombre) LIKE :q OR s.dni LIKE :q
            ORDER BY ma.fecha_hasta - CURRENT_DATE ASC, s.nombre ASC
            LIMIT :limit OFFSET :offset
            """, nativeQuery = true)
    java.util.List<Socio> buscarSociosActivos(
            @Param("q") String q,
            @Param("limit") int limit,
            @Param("offset") int offset
    );

    // Búsqueda de socios VENCIDOS (membresía vencida), ordenados por días vencidos (ascendente)
    @Query(value = """
            WITH ultimas_membresias AS (
                SELECT DISTINCT ON (sm2.dni_socio)
                    sm2.dni_socio,
                    sm2.fecha_hasta
                FROM socio_membresia sm2
                WHERE sm2.activo = true
                ORDER BY sm2.dni_socio, sm2.fecha_hasta DESC
            ),
            socios_vencidos AS (
                SELECT s.dni
                FROM socio s
                INNER JOIN ultimas_membresias um ON um.dni_socio = s.dni
                WHERE CURRENT_DATE > um.fecha_hasta
                  AND (:q IS NULL OR LOWER(s.nombre) LIKE :q OR s.dni LIKE :q)
            )
            SELECT s.dni, s.activo, s.email, s.fecha_nacimiento, s.nombre, s.telefono
            FROM socio s
            INNER JOIN ultimas_membresias um ON um.dni_socio = s.dni
            WHERE s.dni IN (SELECT dni FROM socios_vencidos)
            ORDER BY (CURRENT_DATE - um.fecha_hasta) ASC, s.nombre ASC
            LIMIT :limit OFFSET :offset
            """, nativeQuery = true)
    java.util.List<Socio> buscarSociosVencidos(
            @Param("q") String q,
            @Param("limit") int limit,
            @Param("offset") int offset
    );

    // Búsqueda de socios SIN MEMBRESÍA, ordenados por nombre
    @Query(value = """
            SELECT s.dni, s.activo, s.email, s.fecha_nacimiento, s.nombre, s.telefono
            FROM socio s
            WHERE NOT EXISTS (
                SELECT 1 FROM socio_membresia sm
                WHERE sm.dni_socio = s.dni AND sm.activo = true
            )
              AND (:q IS NULL OR LOWER(s.nombre) LIKE :q OR s.dni LIKE :q)
            ORDER BY s.nombre ASC
            LIMIT :limit OFFSET :offset
            """, nativeQuery = true)
    java.util.List<Socio> buscarSociosSinMembresia(
            @Param("q") String q,
            @Param("limit") int limit,
            @Param("offset") int offset
    );

    // Contadores de estadísticas
    @Query(value = """
            SELECT COUNT(DISTINCT sm.dni_socio)
            FROM socio_membresia sm
            WHERE sm.activo = true
              AND CURRENT_DATE BETWEEN sm.fecha_inicio AND sm.fecha_hasta
            """, nativeQuery = true)
    Long contarSociosActivos();

    @Query(value = """
            SELECT COUNT(DISTINCT s.dni)
            FROM socio s
            WHERE EXISTS (
                SELECT 1 FROM socio_membresia sm
                WHERE sm.dni_socio = s.dni
                  AND sm.activo = true
                  AND CURRENT_DATE > sm.fecha_hasta
            )
            """, nativeQuery = true)
    Long contarSociosVencidos();

     @Query(value = """
            SELECT COUNT(DISTINCT s.dni)
            FROM socio s
            WHERE NOT EXISTS (
                SELECT 1 FROM socio_membresia sm
                WHERE sm.dni_socio = s.dni AND sm.activo = true
            )
            """, nativeQuery = true)
    Long contarSociosSinMembresia();

    // Contadores con filtro de búsqueda
    @Query(value = """
            WITH membresias_activas AS (
                SELECT DISTINCT ON (sm2.dni_socio)
                    sm2.dni_socio,
                    sm2.id_sm,
                    sm2.fecha_hasta,
                    sm2.fecha_inicio
                FROM socio_membresia sm2
                WHERE sm2.activo = true
                  AND (sm2.fecha_hasta IS NULL OR sm2.fecha_hasta >= CURRENT_DATE)
                ORDER BY sm2.dni_socio, sm2.fecha_hasta DESC NULLS FIRST
            )
            SELECT COUNT(DISTINCT s.dni)
            FROM socio s
            INNER JOIN membresias_activas ma ON ma.dni_socio = s.dni
            WHERE :q IS NULL OR LOWER(s.nombre) LIKE :q OR s.dni LIKE :q
            """, nativeQuery = true)
    Long contarSociosActivosFiltrado(@Param("q") String q);

    @Query(value = """
            WITH membresias_activas AS (
                SELECT DISTINCT ON (sm2.dni_socio)
                    sm2.dni_socio,
                    sm2.id_sm
                FROM socio_membresia sm2
                WHERE sm2.activo = true
                  AND (sm2.fecha_hasta IS NULL OR sm2.fecha_hasta >= CURRENT_DATE)
                ORDER BY sm2.dni_socio, sm2.fecha_hasta DESC NULLS FIRST
            ),
            ultimas_membresias AS (
                SELECT DISTINCT ON (sm2.dni_socio)
                    sm2.dni_socio,
                    sm2.fecha_hasta
                FROM socio_membresia sm2
                WHERE sm2.activo = true
                ORDER BY sm2.dni_socio, sm2.fecha_hasta DESC NULLS FIRST
            )
            SELECT COUNT(DISTINCT s.dni)
            FROM socio s
            LEFT JOIN membresias_activas ma ON ma.dni_socio = s.dni
            INNER JOIN ultimas_membresias um ON um.dni_socio = s.dni
            WHERE ma.id_sm IS NULL
              AND CURRENT_DATE > um.fecha_hasta
              AND (:q IS NULL OR LOWER(s.nombre) LIKE :q OR s.dni LIKE :q)
            """, nativeQuery = true)
    Long contarSociosVencidosFiltrado(@Param("q") String q);

    @Query(value = """
            SELECT COUNT(DISTINCT s.dni)
            FROM socio s
            WHERE NOT EXISTS (
                SELECT 1 FROM socio_membresia sm
                WHERE sm.dni_socio = s.dni AND sm.activo = true
            )
              AND (:q IS NULL OR LOWER(s.nombre) LIKE :q OR s.dni LIKE :q)
            """, nativeQuery = true)
    Long contarSociosSinMembresiafiltrado(@Param("q") String q);

    @Query("""
            SELECT s FROM Socio s
            WHERE (:q IS NULL OR LOWER(s.nombre) LIKE :q OR s.dni LIKE :q)
            AND (
                :activo IS NULL OR :activo = 'TODOS' OR
                (:activo = 'ACTIVOS' AND EXISTS (SELECT sm FROM SocioMembresia sm WHERE sm.socio = s AND sm.activo = true AND (sm.fechaHasta IS NULL OR sm.fechaHasta >= CURRENT_DATE))) OR
                (:activo = 'VENCIDOS' AND NOT EXISTS (SELECT sm FROM SocioMembresia sm WHERE sm.socio = s AND sm.activo = true AND (sm.fechaHasta IS NULL OR sm.fechaHasta >= CURRENT_DATE)) AND EXISTS (SELECT sm FROM SocioMembresia sm WHERE sm.socio = s AND sm.activo = true)) OR
                (:activo = 'SIN_MEMBRESIA' AND NOT EXISTS (SELECT sm FROM SocioMembresia sm WHERE sm.socio = s AND sm.activo = true))
            )
            ORDER BY s.nombre ASC
            """)
    org.springframework.data.domain.Page<Socio> buscarSociosPaginados(
            @Param("q") String q,
            @Param("activo") String activo,
            org.springframework.data.domain.Pageable pageable
    );

    @Query(value = "SELECT count(*) FROM asistencia a join socio_membresia sc on sc.dni_socio = a.dni where (sc.id_sm = :idSm) and " +
            "(a.dni = :dni) and ((a.fecha_hora <= sc.fecha_hasta) and (a.fecha_hora >= sc.fecha_inicio)) and a.estado_asistencia = 'VALIDA'", nativeQuery = true)
    Long diasAsistidos(@Param("idSm") Integer id_sm, @Param("dni") String dni);

    @Query("""
               SELECT new com.nexo.gestion.dto.MembresiaVigenteDTO(
                   m.nombre,
                   m.tipoMembresia,
                   sm.fechaHasta
               )
               FROM SocioMembresia sm
               JOIN sm.membresia m
               WHERE sm.socio.dni = :dni
               AND sm.activo = true
               AND (sm.fechaHasta IS NULL OR sm.fechaHasta >= CURRENT_DATE)
               ORDER BY sm.fechaHasta DESC
            """)
    List<MembresiaVigenteDTO> findMembresiasVigentes(@Param("dni") String dni);

    @Query("""
               SELECT CASE WHEN COUNT(sm) > 0 THEN true ELSE false END
               FROM SocioMembresia sm
               WHERE sm.socio.dni = :dni
               AND sm.activo = true
               AND (sm.fechaHasta IS NULL OR sm.fechaHasta >= CURRENT_DATE)
            """)
    boolean existsMembresiaActiva(@Param("dni") String dni);

    @Query(
            value = """
                    SELECT COUNT(*)
                    FROM asistencia a
                    WHERE a.fecha_hora >= CURRENT_DATE
                      AND a.fecha_hora < CURRENT_DATE + INTERVAL '1 day'
                      AND a.dni = :dni
                    """,
            nativeQuery = true
    )
    Long asististenciasHoy(@Param("dni") String dni);


    boolean existsByEmail(String email);

    // Query para listado extendido de socios con info de membresía y asistencias
    @Query(value = """
        WITH membresias_activas AS (
            SELECT DISTINCT ON (sm2.dni_socio) 
                sm2.dni_socio,
                sm2.id_sm,
                sm2.id_membresia,
                sm2.fecha_hasta
            FROM socio_membresia sm2 
            WHERE sm2.activo = true
              AND (sm2.fecha_hasta IS NULL OR sm2.fecha_hasta >= CURRENT_DATE)
            ORDER BY sm2.dni_socio, sm2.fecha_hasta DESC NULLS FIRST
        ),
        ultimas_membresias AS (
            SELECT DISTINCT ON (sm2.dni_socio)
                sm2.dni_socio,
                sm2.fecha_hasta
            FROM socio_membresia sm2
            WHERE sm2.activo = true
            ORDER BY sm2.dni_socio, sm2.fecha_hasta DESC NULLS FIRST
        )
        SELECT 
            s.dni,
            s.nombre,
            s.telefono,
            s.email,
            s.fecha_nacimiento,
            m.nombre as nombre_membresia,
            ma.fecha_hasta as fecha_vencimiento_activa,
            CASE WHEN ma.fecha_hasta IS NOT NULL THEN (ma.fecha_hasta - CURRENT_DATE) ELSE NULL END as dias_restantes,
            CASE 
                WHEN ma.fecha_hasta IS NOT NULL THEN NULL 
                WHEN um.fecha_hasta IS NOT NULL AND um.fecha_hasta < CURRENT_DATE THEN (CURRENT_DATE - um.fecha_hasta) 
                ELSE NULL 
            END as dias_vencidos,
            um.fecha_hasta as ultima_membresia_fecha,
            (SELECT MAX(a.fecha_hora) FROM asistencia a WHERE a.dni = s.dni) as ultima_asistencia
        FROM socio s
        LEFT JOIN membresias_activas ma ON ma.dni_socio = s.dni
        LEFT JOIN membresia m ON ma.id_membresia = m.id_membresia
        LEFT JOIN ultimas_membresias um ON um.dni_socio = s.dni AND ma.id_sm IS NULL
        WHERE (:q IS NULL OR LOWER(s.nombre) LIKE :q OR s.dni LIKE :q)
          AND (
              CAST(:activo AS text) IS NULL OR CAST(:activo AS text) = 'TODOS'
              OR (CAST(:activo AS text) = 'ACTIVOS' AND ma.id_sm IS NOT NULL)
              OR (CAST(:activo AS text) = 'VENCIDOS' AND ma.id_sm IS NULL AND um.fecha_hasta IS NOT NULL)
              OR (CAST(:activo AS text) = 'SIN_MEMBRESIA' AND ma.id_sm IS NULL AND um.fecha_hasta IS NULL)
          )
        ORDER BY 
            CASE 
                WHEN ma.fecha_hasta IS NOT NULL THEN (ma.fecha_hasta - CURRENT_DATE)
                WHEN um.fecha_hasta IS NOT NULL THEN (CURRENT_DATE - um.fecha_hasta)
                ELSE 99999
            END ASC,
            s.nombre ASC
        LIMIT :limit OFFSET :offset
        """, nativeQuery = true)
    List<Object[]> buscarSociosExtendidos(
            @Param("q") String q,
            @Param("activo") String activo,
            @Param("limit") int limit,
            @Param("offset") int offset
    );

    @Query(value = """
        WITH membresias_activas AS (
            SELECT DISTINCT ON (sm2.dni_socio) 
                sm2.dni_socio,
                sm2.id_sm
            FROM socio_membresia sm2 
            WHERE sm2.activo = true
              AND (sm2.fecha_hasta IS NULL OR sm2.fecha_hasta >= CURRENT_DATE)
            ORDER BY sm2.dni_socio, sm2.fecha_hasta DESC NULLS FIRST
        ),
        ultimas_membresias AS (
            SELECT DISTINCT ON (sm2.dni_socio)
                sm2.dni_socio,
                sm2.fecha_hasta
            FROM socio_membresia sm2
            WHERE sm2.activo = true
            ORDER BY sm2.dni_socio, sm2.fecha_hasta DESC NULLS FIRST
        )
        SELECT COUNT(DISTINCT s.dni)
        FROM socio s
        LEFT JOIN membresias_activas ma ON ma.dni_socio = s.dni
        LEFT JOIN ultimas_membresias um ON um.dni_socio = s.dni AND ma.id_sm IS NULL
        WHERE (:q IS NULL OR LOWER(s.nombre) LIKE :q OR s.dni LIKE :q)
          AND (
              CAST(:activo AS text) IS NULL OR CAST(:activo AS text) = 'TODOS'
              OR (CAST(:activo AS text) = 'ACTIVOS' AND ma.id_sm IS NOT NULL)
              OR (CAST(:activo AS text) = 'VENCIDOS' AND ma.id_sm IS NULL AND um.fecha_hasta IS NOT NULL)
              OR (CAST(:activo AS text) = 'SIN_MEMBRESIA' AND ma.id_sm IS NULL AND um.fecha_hasta IS NULL)
          )
        """, nativeQuery = true)
    Long contarSociosExtendidos(
            @Param("q") String q,
            @Param("activo") String activo
    );

    // Búsqueda de todos los socios ordenados alfabéticamente
    @Query(value = """
            SELECT s.dni, s.activo, s.email, s.fecha_nacimiento, s.nombre, s.telefono
            FROM socio s
            WHERE :q IS NULL OR LOWER(s.nombre) LIKE :q OR s.dni LIKE :q
            ORDER BY LOWER(s.nombre) ASC, s.dni ASC
            LIMIT :limit OFFSET :offset
            """, nativeQuery = true)
    java.util.List<Socio> buscarSociosTodos(
            @Param("q") String q,
            @Param("limit") int limit,
            @Param("offset") int offset
    );

    // Búsqueda de socios ACTIVOS ordenados por días restantes por vencer ascendente (los más próximos a vencer primero)
    @Query(value = """
            WITH membresias_activas AS (
                SELECT DISTINCT ON (sm2.dni_socio)
                    sm2.dni_socio,
                    sm2.id_sm,
                    sm2.fecha_hasta,
                    sm2.fecha_inicio
                FROM socio_membresia sm2
                WHERE sm2.activo = true
                  AND (sm2.fecha_hasta IS NULL OR sm2.fecha_hasta >= CURRENT_DATE)
                ORDER BY sm2.dni_socio, sm2.fecha_hasta DESC NULLS FIRST
            )
            SELECT s.dni, s.activo, s.email, s.fecha_nacimiento, s.nombre, s.telefono
            FROM socio s
            INNER JOIN membresias_activas ma ON ma.dni_socio = s.dni
            WHERE :q IS NULL OR LOWER(s.nombre) LIKE :q OR s.dni LIKE :q
            ORDER BY ma.fecha_hasta ASC NULLS LAST, LOWER(s.nombre) ASC
            LIMIT :limit OFFSET :offset
            """, nativeQuery = true)
    java.util.List<Socio> buscarSociosActivosNative(
            @Param("q") String q,
            @Param("limit") int limit,
            @Param("offset") int offset
    );

    // Búsqueda de socios VENCIDOS ordenados por hace cuántos días venció ascendente (los vencidos más recientemente primero)
    @Query(value = """
            WITH membresias_activas AS (
                SELECT DISTINCT ON (sm2.dni_socio)
                    sm2.dni_socio,
                    sm2.id_sm
                FROM socio_membresia sm2
                WHERE sm2.activo = true
                  AND (sm2.fecha_hasta IS NULL OR sm2.fecha_hasta >= CURRENT_DATE)
                ORDER BY sm2.dni_socio, sm2.fecha_hasta DESC NULLS FIRST
            ),
            ultimas_membresias AS (
                SELECT DISTINCT ON (sm2.dni_socio)
                    sm2.dni_socio,
                    sm2.fecha_hasta
                FROM socio_membresia sm2
                WHERE sm2.activo = true
                ORDER BY sm2.dni_socio, sm2.fecha_hasta DESC NULLS FIRST
            )
            SELECT s.dni, s.activo, s.email, s.fecha_nacimiento, s.nombre, s.telefono
            FROM socio s
            LEFT JOIN membresias_activas ma ON ma.dni_socio = s.dni
            INNER JOIN ultimas_membresias um ON um.dni_socio = s.dni
            WHERE ma.id_sm IS NULL
              AND CURRENT_DATE > um.fecha_hasta
              AND (:q IS NULL OR LOWER(s.nombre) LIKE :q OR s.dni LIKE :q)
            ORDER BY um.fecha_hasta DESC, LOWER(s.nombre) ASC
            LIMIT :limit OFFSET :offset
            """, nativeQuery = true)
    java.util.List<Socio> buscarSociosVencidosNative(
            @Param("q") String q,
            @Param("limit") int limit,
            @Param("offset") int offset
    );

    // Búsqueda de socios SIN MEMBRESÍA ordenados alfabéticamente
    @Query(value = """
            SELECT s.dni, s.activo, s.email, s.fecha_nacimiento, s.nombre, s.telefono
            FROM socio s
            WHERE NOT EXISTS (
                SELECT 1 FROM socio_membresia sm WHERE sm.dni_socio = s.dni AND sm.activo = true
            )
            AND (:q IS NULL OR LOWER(s.nombre) LIKE :q OR s.dni LIKE :q)
            ORDER BY LOWER(s.nombre) ASC, s.dni ASC
            LIMIT :limit OFFSET :offset
            """, nativeQuery = true)
    java.util.List<Socio> buscarSociosSinMembresiaNative(
            @Param("q") String q,
            @Param("limit") int limit,
            @Param("offset") int offset
    );

    // Contador para buscarSociosTodos
    @Query(value = """
            SELECT COUNT(DISTINCT s.dni)
            FROM socio s
            WHERE :q IS NULL OR LOWER(s.nombre) LIKE :q OR s.dni LIKE :q
            """, nativeQuery = true)
    Long contarSociosTodosFiltrado(@Param("q") String q);

    @org.springframework.data.jpa.repository.Modifying
    @Query(value = "UPDATE socio SET dni = :nuevoDni WHERE dni = :dniViejo", nativeQuery = true)
    void actualizarDni(@Param("dniViejo") String dniViejo, @Param("nuevoDni") String nuevoDni);
}
