package com.nexo.gestion;

import com.nexo.gestion.services.EmailService;
import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.mail.MailSendException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

public class EmailServiceTest {

    @Mock
    private JavaMailSender mailSender;

    @InjectMocks
    private EmailService emailService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        ReflectionTestUtils.setField(emailService, "fromEmail", "gimnasio@nexo.com");
    }

    @Test
    void esEmailValido_casosValidos() {
        assertTrue(emailService.esEmailValido("socio@gmail.com"));
        assertTrue(emailService.esEmailValido("juan.perez@hotmail.com"));
        assertTrue(emailService.esEmailValido("admin_nexo@empresa.com.ar"));
    }

    @Test
    void esEmailValido_casosInvalidos() {
        assertFalse(emailService.esEmailValido(null));
        assertFalse(emailService.esEmailValido(""));
        assertFalse(emailService.esEmailValido("   "));
        assertFalse(emailService.esEmailValido("socio@@gmail.com"));
        assertFalse(emailService.esEmailValido("socio.com"));
        assertFalse(emailService.esEmailValido("socio@sin-tld"));
    }

    @Test
    void enviarMailHtml_conEmailInvalido_noLlamaSenderYRetornaFalse() {
        boolean resultado = emailService.enviarMailHtml("correo-invalido", "Asunto", "<p>Texto</p>");
        assertFalse(resultado);
        verify(mailSender, never()).send(any(MimeMessage.class));
    }

    @Test
    void enviarMailHtml_conFromEmailVacio_noLlamaSenderYRetornaFalse() {
        ReflectionTestUtils.setField(emailService, "fromEmail", "");
        boolean resultado = emailService.enviarMailHtml("socio@gmail.com", "Asunto", "<p>Texto</p>");
        assertFalse(resultado);
        verify(mailSender, never()).send(any(MimeMessage.class));
    }

    @Test
    void enviarMailHtml_exitoso_retornaTrue() {
        MimeMessage mimeMessage = new MimeMessage((Session) null);
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);

        boolean resultado = emailService.enviarMailHtml("socio@gmail.com", "Asunto Prueba", "<p>Hola</p>");
        assertTrue(resultado);
        verify(mailSender, times(1)).send(mimeMessage);
    }

    @Test
    void enviarMailHtml_cuandoLanzaExcepcion_manejaErrorYRetornaFalse() {
        MimeMessage mimeMessage = new MimeMessage((Session) null);
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);
        doThrow(new MailSendException("SMTP error")).when(mailSender).send(any(MimeMessage.class));

        boolean resultado = emailService.enviarMailHtml("socio@gmail.com", "Asunto", "<p>Texto</p>");
        assertFalse(resultado);
    }

    @Test
    void construirPlantillaPorVencer_contieneInformacionEsperada() {
        String html = emailService.construirPlantillaPorVencer("Carlos Gomez", "Pase Libre", LocalDate.of(2026, 8, 29));
        assertNotNull(html);
        assertTrue(html.contains("Carlos Gomez"));
        assertTrue(html.contains("Pase Libre"));
        assertTrue(html.contains("29/08/2026"));
        assertTrue(html.contains("en 3 días"));
        assertTrue(html.contains("NEXO"));
        assertTrue(html.contains("cid:logoNexo"));
    }

    @Test
    void construirPlantillaVencida_contieneInformacionEsperada() {
        String html = emailService.construirPlantillaVencida("Maria Diaz", "Pase 3 Días", LocalDate.of(2026, 8, 25));
        assertNotNull(html);
        assertTrue(html.contains("Maria Diaz"));
        assertTrue(html.contains("Pase 3 Días"));
        assertTrue(html.contains("25/08/2026"));
        assertTrue(html.toLowerCase().contains("vencida"));
        assertTrue(html.contains("NEXO"));
        assertTrue(html.contains("cid:logoNexo"));
    }
}
