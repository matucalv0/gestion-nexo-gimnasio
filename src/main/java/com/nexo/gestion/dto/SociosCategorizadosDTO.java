package com.nexo.gestion.dto;

import java.util.List;

/**
 * DTO que agrupa socios categorizados (Activos, Vencidos, Sin Membresía)
 * con contadores globales y lista paginada.
 * 
 * El backend retorna TODOS los socios ya ordenados en cada categoría.
 * El frontend aplica la paginación en memoria.
 */
public record SociosCategorizadosDTO(
    // Contadores globales (de TODOS los socios, no solo de la página)
    long totalActivos,
    long totalVencidos,
    long totalSinMembresia,
    
    // Lista paginada de socios (mezcla de todas las categorías, ya ordenada)
    List<SocioDTO> socios,
    int pageNumber,
    int pageSize,
    long totalElements,
    int totalPages
) {}
