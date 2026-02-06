package com.nexo.gestion.services;

import com.nexo.gestion.dto.*;
import com.nexo.gestion.entity.Asistencia;
import com.nexo.gestion.entity.AsistenciaSocioId;
import com.nexo.gestion.entity.Socio;
import com.nexo.gestion.repository.AsistenciaRepository;
import com.nexo.gestion.repository.SocioMembresiaRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.*;

@Service
public class AsistenciaService {
    private final AsistenciaRepository asistenciaRepository;
    private final SocioMembresiaRepository socioMembresiaRepository;

    public AsistenciaService(AsistenciaRepository asistenciaRepository,
            SocioMembresiaRepository socioMembresiaRepository) {
        this.asistenciaRepository = asistenciaRepository;
        this.socioMembresiaRepository = socioMembresiaRepository;
    }

    private AsistenciaSocioIdDTO convertirAAsistenciaSocioIdDTO(AsistenciaSocioId a) {
        return new AsistenciaSocioIdDTO(
                a.getDniSocio(),
                a.getFechaHora());
    }

    private AsistenciaDTO convertirAAsistenciaDTO(Asistencia a) {
        return new AsistenciaDTO(
                a.getSocio().getNombre(),
                a.getSocio().getDni(),
                a.getIdAsistencia().getFechaHora()

        );
    }

    public List<AsistenciaDTO> buscarAsistencias() {
        List<AsistenciaDTO> asistencias = new ArrayList<>();
        for (Asistencia asistencia : asistenciaRepository.findAllOrdenadoPorFecha()) {
            AsistenciaDTO asistenciaDTO = convertirAAsistenciaDTO(asistencia);
            asistencias.add(asistenciaDTO);
        }

        return asistencias;
    }

    public List<AsistenciaDTO> buscarAsistencia(String dniOrNombre) {
        List<AsistenciaDTO> asistencias = new ArrayList<>();

        String q = "%" + dniOrNombre.trim().toLowerCase() + "%";

        for (Asistencia asistencia : asistenciaRepository.buscarPorNombreODni(q)) {
            AsistenciaDTO asistenciaDTO = convertirAAsistenciaDTO(asistencia);
            asistencias.add(asistenciaDTO);
        }

        return asistencias;
    }

    public PageResponseDTO<AsistenciaDTO> buscarAsistenciasPaginadas(int page, int size, LocalDate desde,
            LocalDate hasta, String q) {
        // Defaults: últimos 30 días si no se especifica
        if (hasta == null) {
            hasta = LocalDate.now();
        }
        if (desde == null) {
            desde = hasta.minusDays(30);
        }

        // Manejo de string vacío para búsqueda
        if (q != null && !q.trim().isEmpty()) {
            q = "%" + q.trim().toLowerCase() + "%";
        } else {
            q = null;
        }

        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(page, size);

        // Convertir LocalDate a LocalDateTime para la query
        java.time.LocalDateTime fechaDesde = desde.atStartOfDay();
        java.time.LocalDateTime fechaHasta = hasta.atTime(java.time.LocalTime.MAX);

        org.springframework.data.domain.Page<Asistencia> pageResult = asistenciaRepository.buscarAsistenciasPaginadas(q,
                fechaDesde, fechaHasta, pageable);

        List<AsistenciaDTO> content = pageResult.getContent()
                .stream()
                .map(this::convertirAAsistenciaDTO)
                .toList();

        return new PageResponseDTO<>(
                content,
                pageResult.getNumber(),
                pageResult.getSize(),
                pageResult.getTotalElements(),
                pageResult.getTotalPages());
    }

    public Integer asistenciasTotalesSemana(String dni) {
        return asistenciaRepository.asistenciaSocioEstaSemana(dni);
    }

    public EstadisticasAsistenciasMensualDTO estadisticasMensualesAsistencias() {

        Integer totalMes = asistenciaRepository.asistenciasTotalMes();
        Integer totalSociosActivos = socioMembresiaRepository.sociosActivosEnElMesActual();

        List<Object[]> rows = asistenciaRepository.sociosMasActivosMes();
        List<SocioDTO> sociosDTO = new ArrayList<>();

        Integer maxAsistencias = 0;

        for (int i = 0; i < rows.size(); i++) {
            Object[] row = rows.get(i);

            if (i == 0) {
                maxAsistencias = ((Number) row[6]).intValue();
            }

            sociosDTO.add(new SocioDTO(
                    (String) row[0],
                    (String) row[1],
                    (String) row[2],
                    (String) row[3],
                    null,
                    (Boolean) row[5],
                    null));
        }

        Integer totalMesAnterior = asistenciaRepository.asistenciasTotalMesAnterior();
        if (totalMesAnterior == null)
            totalMesAnterior = 0;

        Integer sociosActivosAnterior = socioMembresiaRepository.sociosActivosMesAnterior();
        if (sociosActivosAnterior == null)
            sociosActivosAnterior = 0;

        // Calcular variaciones
        Double variacionAsistencias = calcularVariacion(totalMes.doubleValue(), totalMesAnterior.doubleValue());
        Double variacionSocios = calcularVariacion(totalSociosActivos.doubleValue(),
                sociosActivosAnterior.doubleValue());

        BigDecimal promedio = BigDecimal.ZERO;
        Double variacionPromedio = 0.0;

        if (totalSociosActivos > 0) {
            promedio = BigDecimal.valueOf(totalMes)
                    .divide(BigDecimal.valueOf(totalSociosActivos), 2, RoundingMode.HALF_UP);
        }

        if (sociosActivosAnterior > 0) {
            BigDecimal promedioAnterior = BigDecimal.valueOf(totalMesAnterior)
                    .divide(BigDecimal.valueOf(sociosActivosAnterior), 2, RoundingMode.HALF_UP);
            variacionPromedio = calcularVariacion(promedio.doubleValue(), promedioAnterior.doubleValue());
        } else if (promedio.compareTo(BigDecimal.ZERO) > 0) {
            variacionPromedio = 100.0;
        }

        return new EstadisticasAsistenciasMensualDTO(
                totalMes,
                promedio,
                totalSociosActivos,
                sociosDTO,
                maxAsistencias,
                variacionAsistencias,
                variacionSocios,
                variacionPromedio);
    }

    private Double calcularVariacion(Double actual, Double anterior) {
        if (anterior == 0) {
            return actual > 0 ? 100.0 : 0.0;
        }
        return ((actual - anterior) / anterior) * 100;
    }

    public List<AsistenciasPorDiaDTO> totalAsistenciasPorDia(String mes) {

        LocalDate fechaMes = LocalDate.parse(mes + "-01");

        List<Object[]> rows = asistenciaRepository.cantidadAsistenciasPorDiaDelMes(fechaMes);

        List<AsistenciasPorDiaDTO> result = new ArrayList<>();

        for (Object[] row : rows) {
            LocalDate fecha = ((java.sql.Date) row[0]).toLocalDate();
            Long total = ((Number) row[1]).longValue();

            result.add(new AsistenciasPorDiaDTO(fecha, total));
        }

        return result;
    }

    public HoraPicoDTO obtenerHoraPico() {
        List<Object[]> rows = asistenciaRepository.asistenciasPorHora();
        if (rows.isEmpty()) {
            return HoraPicoDTO.of(0, 0L);
        }

        Object[] top = rows.get(0);
        Integer hora = ((Number) top[0]).intValue();
        Long total = ((Number) top[1]).longValue();

        return HoraPicoDTO.of(hora, total);
    }

    public List<HoraPicoDTO> obtenerDistribucionPorHora() {
        List<Object[]> rows = asistenciaRepository.asistenciasPorHora();
        List<HoraPicoDTO> distribucion = new ArrayList<>();

        for (Object[] row : rows) {
            Integer hora = ((Number) row[0]).intValue();
            Long total = ((Number) row[1]).longValue();
            distribucion.add(HoraPicoDTO.of(hora, total));
        }

        return distribucion;
    }

}
