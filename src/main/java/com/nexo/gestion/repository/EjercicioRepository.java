package com.nexo.gestion.repository;

import com.nexo.gestion.entity.Ejercicio;
import jakarta.validation.constraints.NotBlank;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EjercicioRepository extends JpaRepository<Ejercicio, Integer> {
    boolean existsByNombre(@NotBlank String nombre);
}
