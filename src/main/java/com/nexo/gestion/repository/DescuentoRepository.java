package com.nexo.gestion.repository;

import com.nexo.gestion.entity.Descuento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DescuentoRepository extends JpaRepository<Descuento, Integer> {
    List<Descuento> findByActivoTrue();
}
