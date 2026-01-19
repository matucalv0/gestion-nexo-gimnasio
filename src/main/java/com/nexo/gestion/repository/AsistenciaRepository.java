package com.nexo.gestion.repository;

import com.nexo.gestion.entity.Asistencia;
import com.nexo.gestion.entity.AsistenciaSocioId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

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


}
