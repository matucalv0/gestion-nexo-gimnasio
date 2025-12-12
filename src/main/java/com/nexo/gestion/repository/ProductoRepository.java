package com.nexo.gestion.repository;

import com.nexo.gestion.entity.Producto;
import org.springframework.data.jpa.repository.JpaRepository;


public interface ProductoRepository extends JpaRepository<Producto, Integer> {
    boolean existsByNombre(String nombre);

}
