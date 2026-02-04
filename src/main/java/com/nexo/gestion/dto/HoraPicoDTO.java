package com.nexo.gestion.dto;

public record HoraPicoDTO(
        Integer hora,
        Long totalAsistencias,
        String rangoHorario
) {
    public static HoraPicoDTO of(Integer hora, Long totalAsistencias) {
        String rangoHorario = String.format("%02d:00 - %02d:00", hora, (hora + 1) % 24);
        return new HoraPicoDTO(hora, totalAsistencias, rangoHorario);
    }
}
