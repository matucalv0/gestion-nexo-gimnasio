package com.nexo.gestion.services;

import com.nexo.gestion.entity.Membresia;
import com.nexo.gestion.entity.Socio;
import com.nexo.gestion.entity.SocioMembresia;
import com.nexo.gestion.repository.SocioMembresiaRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
public class MembresiaNotificacionJob {

    private static final Logger log = LoggerFactory.getLogger(MembresiaNotificacionJob.class);

    private final SocioMembresiaRepository socioMembresiaRepository;
    private final EmailService emailService;

    public MembresiaNotificacionJob(SocioMembresiaRepository socioMembresiaRepository, EmailService emailService) {
        this.socioMembresiaRepository = socioMembresiaRepository;
        this.emailService = emailService;
    }

    /**
     * Cron programado para ejecutarse todos los días a las 09:00 AM.
     * Revisa membresías por vencer en 3 días y membresías que vencieron ayer.
     */
    @Scheduled(cron = "${cron.membresia.notificacion:0 0 9 * * *}")
    @Transactional(readOnly = true)
    public void ejecutarNotificacionesDiarias() {
        log.info("=== [CRON] Iniciando proceso diario de notificaciones de membresías ===");
        LocalDate hoy = LocalDate.now();

        int enviadosPorVencer = procesarMembresiasPorVencer(hoy);
        int enviadosVencidas = procesarMembresiasVencidas(hoy);

        log.info("=== [CRON] Finalizado proceso de notificaciones. Enviados por vencer (3 días): {}, Enviados vencidas: {} ===",
                enviadosPorVencer, enviadosVencidas);
    }

    /**
     * Procesa y envía correos a socios cuya membresía vencerá en 3 días.
     */
    public int procesarMembresiasPorVencer(LocalDate hoy) {
        LocalDate fechaObjetivo = hoy.plusDays(3);
        List<SocioMembresia> porVencer = socioMembresiaRepository.findMembresiasPorVencerEnFecha(fechaObjetivo);

        log.info("Se encontraron {} membresía(s) que vencen el {} (en 3 días)", porVencer.size(), fechaObjetivo);

        int enviados = 0;
        Set<String> sociosNotificados = new HashSet<>();

        for (SocioMembresia sm : porVencer) {
            Socio socio = sm.getSocio();
            if (socio == null || socio.getDni() == null) {
                continue;
            }

            // Evitar enviar múltiples correos al mismo socio si tuviera duplicados
            if (sociosNotificados.contains(socio.getDni())) {
                continue;
            }

            String email = socio.getEmail();
            Membresia membresia = sm.getMembresia();
            String nombreMembresia = (membresia != null) ? membresia.getNombre() : "Plan de Entrenamiento";

            try {
                String asunto = "¡Tu membresía en NEXO vence pronto! (en 3 días)";
                String html = emailService.construirPlantillaPorVencer(socio.getNombre(), nombreMembresia, sm.getFechaHasta());

                boolean ok = emailService.enviarMailHtml(email, asunto, html);
                if (ok) {
                    enviados++;
                    sociosNotificados.add(socio.getDni());
                }
            } catch (Exception e) {
                log.error("Error al procesar notificación de vencimiento próximo para socio DNI {}: {}", 
                        socio.getDni(), e.getMessage());
            }
        }

        return enviados;
    }

    /**
     * Procesa y envía correos a socios cuya membresía venció ayer y no renovaron.
     */
    public int procesarMembresiasVencidas(LocalDate hoy) {
        LocalDate fechaVencida = hoy.minusDays(1);
        List<SocioMembresia> vencidas = socioMembresiaRepository.findMembresiasVencidasEnFecha(fechaVencida, hoy);

        log.info("Se encontraron {} membresía(s) vencidas el {}", vencidas.size(), fechaVencida);

        int enviados = 0;
        Set<String> sociosNotificados = new HashSet<>();

        for (SocioMembresia sm : vencidas) {
            Socio socio = sm.getSocio();
            if (socio == null || socio.getDni() == null) {
                continue;
            }

            // Evitar enviar múltiples correos al mismo socio
            if (sociosNotificados.contains(socio.getDni())) {
                continue;
            }

            String email = socio.getEmail();
            Membresia membresia = sm.getMembresia();
            String nombreMembresia = (membresia != null) ? membresia.getNombre() : "Plan de Entrenamiento";

            try {
                String asunto = "Tu membresía en NEXO ha finalizado";
                String html = emailService.construirPlantillaVencida(socio.getNombre(), nombreMembresia, sm.getFechaHasta());

                boolean ok = emailService.enviarMailHtml(email, asunto, html);
                if (ok) {
                    enviados++;
                    sociosNotificados.add(socio.getDni());
                }
            } catch (Exception e) {
                log.error("Error al procesar notificación de membresía vencida para socio DNI {}: {}", 
                        socio.getDni(), e.getMessage());
            }
        }

        return enviados;
    }
}
