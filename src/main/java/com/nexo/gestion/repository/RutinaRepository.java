package com.nexo.gestion.repository;

import com.nexo.gestion.entity.Rutina;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface RutinaRepository extends JpaRepository<Rutina, Integer> {
    boolean existsByNombre(String nombre);

    Optional<Rutina> findFirstBySocioDniOrderByIdRutinaDesc(String dni);

    List<Rutina> findBySocioIsNull();

    List<Rutina> findByNombreAndSocioIsNotNull(String nombre);

    @Query("SELECT r FROM Rutina r LEFT JOIN FETCH r.detalles d LEFT JOIN FETCH d.ejercicio e LEFT JOIN FETCH e.grupoMuscular WHERE r.idRutina = :id")
    Optional<Rutina> findByIdWithDetails(@Param("id") Integer id);
}
