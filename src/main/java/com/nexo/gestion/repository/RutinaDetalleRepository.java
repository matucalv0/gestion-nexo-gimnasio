package com.nexo.gestion.repository;

import com.nexo.gestion.entity.RutinaDetalle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface RutinaDetalleRepository extends JpaRepository<RutinaDetalle, Long> {
    List<RutinaDetalle> findByRutinaIdRutinaOrderByOrden(Integer idRutina);

    @Modifying
    @Query("DELETE FROM RutinaDetalle rd WHERE rd.rutina.idRutina = :idRutina")
    void deleteByRutinaId(@Param("idRutina") Integer idRutina);
}
