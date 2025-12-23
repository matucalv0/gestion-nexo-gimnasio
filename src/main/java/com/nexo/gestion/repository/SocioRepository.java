package com.nexo.gestion.repository;

import com.nexo.gestion.entity.Socio;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface SocioRepository extends JpaRepository<Socio, String> {
    @Query("SELECT s FROM Socio s WHERE LOWER(s.nombre) LIKE LOWER(CONCAT('%', :query, '%')) " +
            "OR s.dni LIKE CONCAT('%', :query, '%')")
    List<Socio> buscarPorNombreODni(@Param("query") String query);
}
