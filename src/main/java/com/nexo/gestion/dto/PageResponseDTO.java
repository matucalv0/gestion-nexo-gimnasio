package com.nexo.gestion.dto;

import java.util.List;

public record PageResponseDTO<T>(
    List<T> content,
    int page,
    int size,
    long totalElements,
    int totalPages
) {}
