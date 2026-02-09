package com.nexo.gestion.dto;

import java.util.List;

public record RutinaDetalleImportDTO(
    Integer idEjercicio,
    String nombreEjercicio,
    String series,
    String repeticiones,
    List<String> cargas,
    Integer dia,
    Integer orden
) {}
