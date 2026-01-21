package com.nexo.gestion.repository;

import com.nexo.gestion.entity.Producto;
import com.nexo.gestion.entity.Socio;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;


public interface ProductoRepository extends JpaRepository<Producto, Integer> {
    boolean existsByNombre(String nombre);

    @Query("SELECT p FROM Producto p WHERE LOWER(p.nombre) LIKE LOWER(CONCAT('%', :query, '%')) " +
            "OR str(p.idProducto) LIKE CONCAT('%', :query, '%')")
    List<Producto> buscarPorNombreOCodigo(@Param("query") String query);

}
