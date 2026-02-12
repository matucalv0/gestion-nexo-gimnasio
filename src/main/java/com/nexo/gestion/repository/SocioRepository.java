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

    @Query("""
            SELECT s FROM Socio s
            WHERE (:q IS NULL OR LOWER(s.nombre) LIKE :q OR s.dni LIKE :q)
            AND (
                :activo IS NULL OR
                (:activo = true AND EXISTS (SELECT sm FROM SocioMembresia sm WHERE sm.socio = s AND sm.activo = true AND CURRENT_DATE BETWEEN sm.fechaInicio AND sm.fechaHasta)) OR
                (:activo = false AND NOT EXISTS (SELECT sm FROM SocioMembresia sm WHERE sm.socio = s AND sm.activo = true AND CURRENT_DATE BETWEEN sm.fechaInicio AND sm.fechaHasta))
            )
            ORDER BY s.nombre ASC
            """)
    org.springframework.data.domain.Page<Socio> buscarSociosPaginados(
            @Param("q") String q,
            @Param("activo") Boolean activo,
            org.springframework.data.domain.Pageable pageable
    );

    @Query(value = "SELECT count(*) FROM asistencia a join socio_membresia sc on sc.dni_socio = a.dni where (sc.id_sm = :idSm) and " +
            "(a.dni = :dni) and ((a.fecha_hora <= sc.fecha_hasta) and (a.fecha_hora >= sc.fecha_inicio))", nativeQuery = true)
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
               AND CURRENT_DATE BETWEEN sm.fechaInicio AND sm.fechaHasta
               ORDER BY sm.fechaHasta DESC
            """)
    List<MembresiaVigenteDTO> findMembresiasVigentes(@Param("dni") String dni);

    @Query("""
               SELECT CASE WHEN COUNT(sm) > 0 THEN true ELSE false END
               FROM SocioMembresia sm
               WHERE sm.socio.dni = :dni
               AND CURRENT_DATE BETWEEN sm.fechaInicio AND sm.fechaHasta
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
              AND CURRENT_DATE BETWEEN sm2.fecha_inicio AND sm2.fecha_hasta
            ORDER BY sm2.dni_socio, sm2.fecha_hasta DESC
        )
        SELECT 
            s.dni,
            s.nombre,
            s.telefono,
            s.email,
            s.fecha_nacimiento,
            m.nombre as nombre_membresia,
            ma.fecha_hasta,
            CASE WHEN ma.fecha_hasta IS NOT NULL THEN (ma.fecha_hasta - CURRENT_DATE) ELSE NULL END as dias_restantes,
            (SELECT MAX(a.fecha_hora) FROM asistencia a WHERE a.dni = s.dni) as ultima_asistencia
        FROM socio s
        LEFT JOIN membresias_activas ma ON ma.dni_socio = s.dni
        LEFT JOIN membresia m ON ma.id_membresia = m.id_membresia
        WHERE (:q IS NULL OR LOWER(s.nombre) LIKE :q OR s.dni LIKE :q)
          AND (
              :activo IS NULL 
              OR (:activo = true AND ma.id_sm IS NOT NULL)
              OR (:activo = false AND ma.id_sm IS NULL)
          )
        ORDER BY s.nombre ASC
        LIMIT :limit OFFSET :offset
        """, nativeQuery = true)
    List<Object[]> buscarSociosExtendidos(
            @Param("q") String q,
            @Param("activo") Boolean activo,
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
              AND CURRENT_DATE BETWEEN sm2.fecha_inicio AND sm2.fecha_hasta
            ORDER BY sm2.dni_socio, sm2.fecha_hasta DESC
        )
        SELECT COUNT(DISTINCT s.dni)
        FROM socio s
        LEFT JOIN membresias_activas ma ON ma.dni_socio = s.dni
        WHERE (:q IS NULL OR LOWER(s.nombre) LIKE :q OR s.dni LIKE :q)
          AND (
              :activo IS NULL 
              OR (:activo = true AND ma.id_sm IS NOT NULL)
              OR (:activo = false AND ma.id_sm IS NULL)
          )
        """, nativeQuery = true)
    Long contarSociosExtendidos(
            @Param("q") String q,
            @Param("activo") Boolean activo
    );
}

