package com.nexo.gestion.repository;

import com.nexo.gestion.dto.MembresiaVigenteDTO;
import com.nexo.gestion.entity.Socio;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface SocioRepository extends JpaRepository<Socio, String> {
    @Query("SELECT s FROM Socio s WHERE LOWER(s.nombre) LIKE LOWER(CONCAT('%', :query, '%')) " +
            "OR s.dni LIKE CONCAT('%', :query, '%')")
    List<Socio> buscarPorNombreODni(@Param("query") String query);

    @Query(value = "SELECT count(*) FROM asistencia a join socio_membresia sc on sc.dni_socio = a.dni where (sc.id_sm = :id_sm) and " +
            "(a.dni = :dni) and ((a.fecha_hora <= sc.fecha_hasta) and (a.fecha_hora >= sc.fecha_inicio))", nativeQuery = true)
    Long diasAsistidos(@Param("id_sm") Integer id_sm, @Param("dni") String dni);

    @Query("""
            SELECT new com.nexo.gestion.dto.MembresiaVigenteDTO(
              m.nombre,
              sm.fecha_hasta
            )
            FROM SocioMembresia sm
            JOIN sm.membresia m
            WHERE sm.socio.dni = :dni
            AND CURRENT_DATE BETWEEN sm.fecha_inicio AND sm.fecha_hasta
           """)
    Optional<MembresiaVigenteDTO> findMembresiaVigente(@Param("dni") String dni);






}
