package com.nexo.gestion.services;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.regex.Pattern;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private static final Pattern EMAIL_PATTERN = Pattern.compile(
            "^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$"
    );

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String fromEmail;

    public EmailService(@Autowired(required = false) JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    /**
     * Valida si un email tiene un formato sintáctico válido.
     */
    public boolean esEmailValido(String email) {
        if (email == null || email.isBlank()) {
            return false;
        }
        String cleanEmail = email.trim();
        if (!EMAIL_PATTERN.matcher(cleanEmail).matches()) {
            return false;
        }
        try {
            InternetAddress emailAddr = new InternetAddress(cleanEmail);
            emailAddr.validate();
            return true;
        } catch (Exception ex) {
            return false;
        }
    }

    public record EmailResultado(boolean exitoso, String mensaje) {}

    /**
     * Envía un correo en formato HTML de manera segura y retorna el resultado detallado.
     */
    public EmailResultado enviarMailHtmlDetallado(String destinatario, String asunto, String cuerpoHtml) {
        if (!esEmailValido(destinatario)) {
            String error = "Dirección de correo inválida: '" + destinatario + "'";
            log.warn("Se omitió el envío de correo. {}", error);
            return new EmailResultado(false, error);
        }

        if (mailSender == null) {
            String error = "El servicio de correo (JavaMailSender) no está disponible o no fue configurado.";
            log.warn("{}. El correo a '{}' no fue enviado.", error, destinatario);
            return new EmailResultado(false, error);
        }

        if (fromEmail == null || fromEmail.isBlank()) {
            String error = "La variable MAIL_USERNAME está vacía o no fue cargada en el entorno.";
            log.warn("{}. El correo a '{}' no fue enviado.", error, destinatario);
            return new EmailResultado(false, error);
        }

        try {
            MimeMessage mensaje = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mensaje, true, "UTF-8");

            helper.setFrom(fromEmail.trim(), "NEXO");
            helper.setTo(destinatario.trim());
            helper.setSubject(asunto);
            helper.setText(cuerpoHtml, true);

            // Adjuntar logo como recurso inline
            try {
                org.springframework.core.io.ClassPathResource logo = new org.springframework.core.io.ClassPathResource("static/assets/nexologo.png");
                if (logo.exists()) {
                    helper.addInline("logoNexo", logo, "image/png");
                }
            } catch (Exception ex) {
                log.debug("No se pudo adjuntar logo inline: {}", ex.getMessage());
            }

            mailSender.send(mensaje);
            log.info("Correo enviado exitosamente a '{}' con asunto '{}'", destinatario, asunto);
            return new EmailResultado(true, "Correo enviado exitosamente a " + destinatario);

        } catch (MessagingException | MailException e) {
            String error = "Error SMTP al enviar correo a '" + destinatario + "': " + e.getMessage();
            log.error(error);
            return new EmailResultado(false, error);
        } catch (Exception e) {
            String error = "Error inesperado al enviar correo: " + e.getMessage();
            log.error(error, e);
            return new EmailResultado(false, error);
        }
    }

    /**
     * Envía un correo en formato HTML de manera segura.
     * @param destinatario Dirección de correo del socio
     * @param asunto Título del correo
     * @param cuerpoHtml Contenido HTML del mensaje
     * @return true si el correo fue enviado exitosamente, false si ocurrió un error
     */
    public boolean enviarMailHtml(String destinatario, String asunto, String cuerpoHtml) {
        return enviarMailHtmlDetallado(destinatario, asunto, cuerpoHtml).exitoso();
    }

    /**
     * Genera la plantilla HTML para avisar que la membresía vence en 3 días.
     */
    public String construirPlantillaPorVencer(String nombreSocio, String nombreMembresia, LocalDate fechaVencimiento) {
        String fechaFormateada = fechaVencimiento != null 
                ? fechaVencimiento.format(DateTimeFormatter.ofPattern("dd/MM/yyyy")) 
                : "pronto";

        return """
            <!DOCTYPE html>
            <html lang="es">
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #0f172a; margin: 0; padding: 20px; color: #333333; }
                    .card { max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.2); }
                    .header { background: linear-gradient(135deg, #09090b, #18181b); color: #ffffff; padding: 32px 24px 28px 24px; text-align: center; }
                    .logo-img { max-height: 52px; width: auto; margin: 0 auto 12px auto; display: block; }
                    .header h1 { margin: 0; font-size: 26px; letter-spacing: 2px; font-weight: 800; color: #ffffff; }
                    .header p { margin: 6px 0 0; color: #a1a1aa; font-size: 12px; text-transform: uppercase; letter-spacing: 1.5px; }
                    .content { padding: 32px 28px; line-height: 1.6; color: #27272a; }
                    .badge { display: inline-block; background-color: #fef3c7; color: #b45309; padding: 6px 14px; border-radius: 20px; font-weight: 700; font-size: 12px; margin-bottom: 16px; letter-spacing: 0.5px; }
                    .greeting { font-size: 20px; font-weight: 700; color: #09090b; margin-top: 0; margin-bottom: 12px; }
                    .highlight-box { background-color: #f8fafc; border-left: 4px solid #f97316; padding: 16px 20px; margin: 24px 0; border-radius: 8px; border: 1px solid #f1f5f9; border-left: 4px solid #f97316; }
                    .highlight-box p { margin: 4px 0; font-size: 14px; }
                    .footer { text-align: center; padding: 22px; font-size: 12px; color: #71717a; background-color: #f8fafc; border-top: 1px solid #e4e4e7; }
                </style>
            </head>
            <body>
                <div class="card">
                    <div class="header">
                        <img src="cid:logoNexo" alt="NEXO" class="logo-img" />
                        <h1>NEXO</h1>
                        <p>Hacemos que pase</p>
                    </div>
                    <div class="content">
                        <span class="badge">⏰ RECORDATORIO DE VENCIMIENTO</span>
                        <h2 class="greeting">¡Hola, %s!</h2>
                        <p>Te recordamos que tu membresía está próxima a vencer. Queremos ayudarte a mantener el ritmo y continuar con tus objetivos sin interrupciones.</p>
                        
                        <div class="highlight-box">
                            <p><strong>Plan actual:</strong> %s</p>
                            <p><strong>Fecha de vencimiento:</strong> %s (en 3 días)</p>
                        </div>

                        <p>Podés acercarte a la recepción o comunicarte con nosotros para renovarla cuando gustes.</p>
                        <p>¡Te esperamos para seguir entrenando juntos! 💪🏋️</p>
                    </div>
                    <div class="footer">
                        <p><strong>NEXO</strong> • Gestión de Membresías</p>
                    </div>
                </div>
            </body>
            </html>
            """.formatted(
                nombreSocio != null ? nombreSocio : "socio/a",
                nombreMembresia != null ? nombreMembresia : "Membresía",
                fechaFormateada
            );
    }

    /**
     * Genera la plantilla HTML para avisar que la membresía ha vencido.
     */
    public String construirPlantillaVencida(String nombreSocio, String nombreMembresia, LocalDate fechaVencimiento) {
        String fechaFormateada = fechaVencimiento != null 
                ? fechaVencimiento.format(DateTimeFormatter.ofPattern("dd/MM/yyyy")) 
                : "recientemente";

        return """
            <!DOCTYPE html>
            <html lang="es">
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #0f172a; margin: 0; padding: 20px; color: #333333; }
                    .card { max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.2); }
                    .header { background: linear-gradient(135deg, #09090b, #18181b); color: #ffffff; padding: 32px 24px 28px 24px; text-align: center; }
                    .logo-img { max-height: 52px; width: auto; margin: 0 auto 12px auto; display: block; }
                    .header h1 { margin: 0; font-size: 26px; letter-spacing: 2px; font-weight: 800; color: #ffffff; }
                    .header p { margin: 6px 0 0; color: #a1a1aa; font-size: 12px; text-transform: uppercase; letter-spacing: 1.5px; }
                    .content { padding: 32px 28px; line-height: 1.6; color: #27272a; }
                    .badge { display: inline-block; background-color: #fee2e2; color: #dc2626; padding: 6px 14px; border-radius: 20px; font-weight: 700; font-size: 12px; margin-bottom: 16px; letter-spacing: 0.5px; }
                    .greeting { font-size: 20px; font-weight: 700; color: #09090b; margin-top: 0; margin-bottom: 12px; }
                    .highlight-box { background-color: #f8fafc; border-left: 4px solid #ef4444; padding: 16px 20px; margin: 24px 0; border-radius: 8px; border: 1px solid #f1f5f9; border-left: 4px solid #ef4444; }
                    .highlight-box p { margin: 4px 0; font-size: 14px; }
                    .footer { text-align: center; padding: 22px; font-size: 12px; color: #71717a; background-color: #f8fafc; border-top: 1px solid #e4e4e7; }
                </style>
            </head>
            <body>
                <div class="card">
                    <div class="header">
                        <img src="cid:logoNexo" alt="NEXO" class="logo-img" />
                        <h1>NEXO</h1>
                        <p>Hacemos que pase</p>
                    </div>
                    <div class="content">
                        <span class="badge">⚠️ MEMBRESÍA VENCIDA</span>
                        <h2 class="greeting">¡Hola, %s!</h2>
                        <p>Te informamos que tu membresía ha finalizado.</p>
                        
                        <div class="highlight-box">
                            <p><strong>Plan finalizado:</strong> %s</p>
                            <p><strong>Fecha de vencimiento:</strong> %s</p>
                        </div>

                        <p>¡No te quedes sin entrenar! Acércate a la recepción o comunícate con nosotros para renovar tu plan y retomar tus rutinas.</p>
                        <p>¡Te esperamos pronto en NEXO! 💪🔥</p>
                    </div>
                    <div class="footer">
                        <p><strong>NEXO</strong> • Gestión de Membresías</p>
                    </div>
                </div>
            </body>
            </html>
            """.formatted(
                nombreSocio != null ? nombreSocio : "socio/a",
                nombreMembresia != null ? nombreMembresia : "Membresía",
                fechaFormateada
            );
    }
}
