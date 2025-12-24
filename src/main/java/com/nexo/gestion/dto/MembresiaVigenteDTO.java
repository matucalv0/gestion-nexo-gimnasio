package com.nexo.gestion.dto;

import java.time.LocalDate;

public record MembresiaVigenteDTO(
        String tipo,
        LocalDate vencimiento
) {}
