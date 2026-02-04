package com.nexo.gestion.dto;

import java.time.LocalDate;

public record SocioInactivoDTO(
        String dni,
        String nombre,
        String telefono,
        Integer diasSinAsistir,
        LocalDate ultimaAsistencia
) {
}
