package com.nexo.gestion.dto;

import com.nexo.gestion.entity.TipoMembresia;

import java.time.LocalDate;

public record MembresiaVigenteDTO(
        String tipo,
        TipoMembresia tipoMembresia,
        LocalDate vencimiento
) {}
