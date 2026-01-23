package com.nexo.gestion.repository;

import com.nexo.gestion.entity.Gasto;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GastoRepository extends JpaRepository<Gasto, Integer> {
}
