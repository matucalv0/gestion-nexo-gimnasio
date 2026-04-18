package com.nexo.gestion.repository;

import com.nexo.gestion.entity.Rutina;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface RutinaRepository extends JpaRepository<Rutina, Integer> {
    @EntityGraph(attributePaths = {"empleado", "socio", "detalles"})
    org.springframework.data.domain.Page<Rutina> findBySocioIsNull(org.springframework.data.domain.Pageable pageable);
    
    @EntityGraph(attributePaths = {"empleado", "socio", "detalles"})
    org.springframework.data.domain.Page<Rutina> findBySocioIsNotNull(org.springframework.data.domain.Pageable pageable);
    boolean existsByNombre(String nombre);

    @EntityGraph(attributePaths = {"empleado", "socio", "detalles"})
    Optional<Rutina> findFirstBySocioDniOrderByIdRutinaDesc(String dni);

    @EntityGraph(attributePaths = {"empleado", "socio", "detalles"})
    List<Rutina> findBySocioIsNull();

    @EntityGraph(attributePaths = {"empleado", "socio", "detalles"})
    List<Rutina> findByNombreAndSocioIsNotNull(String nombre);

    @Query("SELECT r FROM Rutina r LEFT JOIN FETCH r.detalles d LEFT JOIN FETCH d.ejercicio e LEFT JOIN FETCH e.grupoMuscular WHERE r.idRutina = :id")
    Optional<Rutina> findByIdWithDetails(@Param("id") Integer id);

    @EntityGraph(attributePaths = {"empleado", "socio", "detalles"})
    Optional<Rutina> findFirstByNombreAndSocioIsNull(String nombre);

    @Query(value = "SELECT DISTINCT ON (LOWER(TRIM(r.nombre))) r.* " +
            "FROM rutina r " +
            "ORDER BY LOWER(TRIM(r.nombre)), r.dni_socio ASC NULLS FIRST, r.id_rutina DESC", 
            nativeQuery = true)
    List<Rutina> findRutinasCondensadas();
    @Query(value = "SELECT DISTINCT ON (r.dni_socio) r.* " +
            "FROM rutina r " +
            "WHERE r.dni_socio IN :dnis " +
            "ORDER BY r.dni_socio, r.id_rutina DESC", 
            nativeQuery = true)
    List<Rutina> findLatestBySocioDnis(@Param("dnis") List<String> dnis);
}
