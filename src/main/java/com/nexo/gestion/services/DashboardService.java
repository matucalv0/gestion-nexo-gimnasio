package com.nexo.gestion.services;

import com.nexo.gestion.dto.DashboardDTO;
import com.nexo.gestion.dto.SocioPorVencerDTO;
import com.nexo.gestion.repository.AsistenciaRepository;
import com.nexo.gestion.repository.PagoRepository;
import com.nexo.gestion.repository.SocioMembresiaRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
public class DashboardService {

    private final PagoRepository pagoRepository;
    private final SocioMembresiaRepository socioMembresiaRepository;
    private final AsistenciaRepository asistenciaRepository;

    public DashboardService(
            PagoRepository pagoRepository,
            SocioMembresiaRepository socioMembresiaRepository,
            AsistenciaRepository asistenciaRepository) {
        this.pagoRepository = pagoRepository;
        this.socioMembresiaRepository = socioMembresiaRepository;
        this.asistenciaRepository = asistenciaRepository;
    }

    public DashboardDTO obtenerDashboard() {
        // Recaudación de hoy
        BigDecimal recaudacionHoy = pagoRepository.totalRecaudadoHoy();
        if (recaudacionHoy == null) recaudacionHoy = BigDecimal.ZERO;

        // Socios activos (con membresía vigente)
        Integer sociosActivos = socioMembresiaRepository.contarSociosActivosHoy();
        if (sociosActivos == null) sociosActivos = 0;

        // Socios por vencer en 7 días
        List<Object[]> porVencerRows = socioMembresiaRepository.sociosPorVencerEnDias(7);
        List<SocioPorVencerDTO> listaPorVencer = new ArrayList<>();

        for (Object[] row : porVencerRows) {
            listaPorVencer.add(new SocioPorVencerDTO(
                    (String) row[0],                                          // dni
                    (String) row[1],                                          // nombre
                    (String) row[2],                                          // telefono
                    (String) row[3],                                          // nombreMembresia
                    row[4] != null ? ((java.sql.Date) row[4]).toLocalDate() : null,  // fechaVencimiento
                    row[5] != null ? ((Number) row[5]).intValue() : 0         // diasRestantes
            ));
        }

        // Asistencias de hoy
        Integer asistenciasHoy = asistenciaRepository.contarAsistenciasHoy();
        if (asistenciasHoy == null) asistenciasHoy = 0;

        return new DashboardDTO(
                recaudacionHoy,
                sociosActivos,
                listaPorVencer.size(),
                asistenciasHoy,
                listaPorVencer
        );
    }
}

