package com.nexo.gestion.repository;

import com.nexo.gestion.entity.Membresia;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MembresiaRepository extends JpaRepository<Membresia, Integer> {
    List<Membresia> findAllByOrderByNombreAsc();
}
