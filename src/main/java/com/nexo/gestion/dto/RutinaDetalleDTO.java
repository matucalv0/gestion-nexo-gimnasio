package com.nexo.gestion.dto;

import java.util.List;

public record RutinaDetalleDTO(
                Long idDetalle,
                Integer idEjercicio,
                String nombreEjercicio,
                String videoUrl,
                Integer idGrupo,
                Integer orden,
                String series,
                String repeticiones,
                String carga,
                String descanso,
                String observacion,
                Integer dia,
                List<String> cargas) {

        // Constructor alternativo para compatibilidad con código existente
        public RutinaDetalleDTO(Long idDetalle, Integer idEjercicio, String nombreEjercicio,
                        String videoUrl, Integer idGrupo, Integer orden, String series,
                        String repeticiones, String carga, String descanso, String observacion, Integer dia) {
                this(idDetalle, idEjercicio, nombreEjercicio, videoUrl, idGrupo, orden, series,
                                repeticiones, carga, descanso, observacion, dia, List.of());
        }
}
