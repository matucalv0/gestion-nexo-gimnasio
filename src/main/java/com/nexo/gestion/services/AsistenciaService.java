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

    public AsistenciaService(AsistenciaRepository asistenciaRepository, SocioMembresiaRepository socioMembresiaRepository){
        this.asistenciaRepository = asistenciaRepository;
        this.socioMembresiaRepository = socioMembresiaRepository;
    }

    private AsistenciaSocioIdDTO convertirAAsistenciaSocioIdDTO(AsistenciaSocioId a){
        return new AsistenciaSocioIdDTO(
                a.getDniSocio(),
                a.getFechaHora()
        );
    }

    private AsistenciaDTO convertirAAsistenciaDTO(Asistencia a){
        return new AsistenciaDTO(
                a.getSocio().getNombre(),
                a.getSocio().getDni(),
                a.getIdAsistencia().getFechaHora()

        );
    }


    public List<AsistenciaDTO> buscarAsistencias(){
        List<AsistenciaDTO> asistencias = new ArrayList<>();
        for (Asistencia asistencia: asistenciaRepository.findAllOrdenadoPorFecha()){
            AsistenciaDTO asistenciaDTO = convertirAAsistenciaDTO(asistencia);
            asistencias.add(asistenciaDTO);
        }

        return asistencias;
    }

    public List<AsistenciaDTO> buscarAsistencia(String dniOrNombre) {
        List<AsistenciaDTO> asistencias = new ArrayList<>();

        for (Asistencia asistencia: asistenciaRepository.buscarPorNombreODni(dniOrNombre)){
            AsistenciaDTO asistenciaDTO = convertirAAsistenciaDTO(asistencia);
            asistencias.add(asistenciaDTO);
        }

        return asistencias;
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
                    (Boolean) row[5]
            ));
        }

        BigDecimal promedio = BigDecimal.valueOf(totalMes)
                .divide(BigDecimal.valueOf(totalSociosActivos), 2, RoundingMode.HALF_UP);

        return new EstadisticasAsistenciasMensualDTO(
                totalMes,
                promedio,
                totalSociosActivos,
                sociosDTO,
                maxAsistencias
        );
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


}
