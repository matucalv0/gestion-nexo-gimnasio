package com.nexo.gestion.repository;

import com.nexo.gestion.entity.EjercicioRutina;
import com.nexo.gestion.entity.EjercicioRutinaId;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EjercicioRutinaRepository extends JpaRepository<EjercicioRutina, EjercicioRutinaId> {
}
