package com.nexo.gestion.repository;

import com.nexo.gestion.entity.DetallePago;
import com.nexo.gestion.entity.DetallePagoId;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DetallePagoRepository extends JpaRepository<DetallePago, DetallePagoId> {
}
