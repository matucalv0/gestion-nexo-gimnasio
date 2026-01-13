package com.nexo.gestion.repository;

import com.nexo.gestion.entity.SocioMembresia;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDate;

public interface SocioMembresiaRepository extends JpaRepository<SocioMembresia, Integer> {
    @Query("""
SELECT MAX(sm.fechaHasta)
FROM SocioMembresia sm
WHERE sm.socio.dni = :dni
AND sm.fechaHasta >= CURRENT_DATE
""")
    LocalDate findUltimoVencimientoVigente(String dni);

}
