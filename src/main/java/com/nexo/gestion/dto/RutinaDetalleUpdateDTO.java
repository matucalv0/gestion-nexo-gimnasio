package com.nexo.gestion.dto;

import jakarta.validation.constraints.NotNull;
import java.util.List;

public record RutinaDetalleUpdateDTO(
                @NotNull Long idDetalle,
                Integer idEjercicio,
                Integer orden,
                String series,
                String repeticiones,
                String carga,
                String descanso,
                String observacion,
                Integer dia,
                List<String> cargas) {
}
