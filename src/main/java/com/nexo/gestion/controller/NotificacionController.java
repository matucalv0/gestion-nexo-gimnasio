package com.nexo.gestion.controller;

import com.nexo.gestion.services.EmailService;
import com.nexo.gestion.services.MembresiaNotificacionJob;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Map;

@RestController
@RequestMapping("/notificaciones")
public class NotificacionController {

    private final EmailService emailService;
    private final MembresiaNotificacionJob notificacionJob;

    public NotificacionController(EmailService emailService, MembresiaNotificacionJob notificacionJob) {
        this.emailService = emailService;
        this.notificacionJob = notificacionJob;
    }

    /**
     * Endpoint para enviar un correo de prueba simple y verificar las credenciales SMTP.
     */
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/test-email")
    public ResponseEntity<?> testEmail(@RequestParam String destinatario) {
        String asunto = "Prueba de Envío - NEXO";
        String html = emailService.construirPlantillaPorVencer("Usuario de Prueba", "Pase Libre", LocalDate.now().plusDays(3));
        EmailService.EmailResultado resultado = emailService.enviarMailHtmlDetallado(destinatario, asunto, html);

        if (resultado.exitoso()) {
            return ResponseEntity.ok(Map.of(
                    "status", "success",
                    "mensaje", resultado.mensaje()
            ));
        } else {
            return ResponseEntity.badRequest().body(Map.of(
                    "status", "error",
                    "mensaje", resultado.mensaje()
            ));
        }
    }

    /**
     * Endpoint manual para ejecutar el proceso diario sin esperar a las 09:00 AM.
     */
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/ejecutar-cron")
    public ResponseEntity<?> ejecutarCronManualmente() {
        LocalDate hoy = LocalDate.now();
        int porVencer = notificacionJob.procesarMembresiasPorVencer(hoy);
        int vencidas = notificacionJob.procesarMembresiasVencidas(hoy);

        return ResponseEntity.ok(Map.of(
                "status", "success",
                "fechaProceso", hoy.toString(),
                "enviadosPorVencer3Dias", porVencer,
                "enviadosVencidas", vencidas
        ));
    }
}
