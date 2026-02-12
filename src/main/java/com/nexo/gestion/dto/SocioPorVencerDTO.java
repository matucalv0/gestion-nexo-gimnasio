package com.nexo.gestion.dto;

import java.time.LocalDate;

public record SocioPorVencerDTO(
    String dni,
    String nombre,
    String telefono,
    String nombreMembresia,
    LocalDate fechaVencimiento,
    Integer diasRestantes
) {}

