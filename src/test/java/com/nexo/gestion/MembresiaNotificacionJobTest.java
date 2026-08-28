package com.nexo.gestion;

import com.nexo.gestion.entity.Membresia;
import com.nexo.gestion.entity.Socio;
import com.nexo.gestion.entity.SocioMembresia;
import com.nexo.gestion.repository.SocioMembresiaRepository;
import com.nexo.gestion.services.EmailService;
import com.nexo.gestion.services.MembresiaNotificacionJob;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

public class MembresiaNotificacionJobTest {

    @Mock
    private SocioMembresiaRepository socioMembresiaRepository;

    @Mock
    private EmailService emailService;

    @InjectMocks
    private MembresiaNotificacionJob membresiaNotificacionJob;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void procesarMembresiasPorVencer_sinMembresias_noEnviaEmails() {
        LocalDate hoy = LocalDate.now();
        when(socioMembresiaRepository.findMembresiasPorVencerEnFecha(hoy.plusDays(3)))
                .thenReturn(Collections.emptyList());

        int total = membresiaNotificacionJob.procesarMembresiasPorVencer(hoy);

        assertEquals(0, total);
        verify(emailService, never()).enviarMailHtml(anyString(), anyString(), anyString());
    }

    @Test
    void procesarMembresiasPorVencer_conMembresiasValidas_enviaEmails() {
        LocalDate hoy = LocalDate.now();
        LocalDate vencimiento = hoy.plusDays(3);

        Socio socio1 = new Socio("11111111", "Juan Perez", "123456", "juan@test.com", LocalDate.of(1990, 1, 1));
        Membresia m1 = new Membresia("Pase Libre", 30, new BigDecimal("20000"));
        SocioMembresia sm1 = new SocioMembresia(socio1, m1, hoy.minusDays(27), vencimiento);

        Socio socio2 = new Socio("22222222", "Ana Lopez", "654321", "ana@test.com", LocalDate.of(1995, 5, 5));
        Membresia m2 = new Membresia("Pase 3 Días", 30, new BigDecimal("15000"));
        SocioMembresia sm2 = new SocioMembresia(socio2, m2, hoy.minusDays(27), vencimiento);

        when(socioMembresiaRepository.findMembresiasPorVencerEnFecha(vencimiento))
                .thenReturn(List.of(sm1, sm2));

        when(emailService.construirPlantillaPorVencer(anyString(), anyString(), any(LocalDate.class)))
                .thenReturn("<html>contenido</html>");
        when(emailService.enviarMailHtml(anyString(), anyString(), anyString()))
                .thenReturn(true);

        int total = membresiaNotificacionJob.procesarMembresiasPorVencer(hoy);

        assertEquals(2, total);
        verify(emailService, times(2)).enviarMailHtml(anyString(), contains("en 3 días"), anyString());
    }

    @Test
    void procesarMembresiasPorVencer_siUnEnvioFalla_continuaConLosOtros() {
        LocalDate hoy = LocalDate.now();
        LocalDate vencimiento = hoy.plusDays(3);

        Socio socio1 = new Socio("11111111", "Juan Perez", "123456", "invalido@", LocalDate.of(1990, 1, 1));
        Membresia m1 = new Membresia("Pase Libre", 30, new BigDecimal("20000"));
        SocioMembresia sm1 = new SocioMembresia(socio1, m1, hoy.minusDays(27), vencimiento);

        Socio socio2 = new Socio("22222222", "Ana Lopez", "654321", "ana@test.com", LocalDate.of(1995, 5, 5));
        Membresia m2 = new Membresia("Pase 3 Días", 30, new BigDecimal("15000"));
        SocioMembresia sm2 = new SocioMembresia(socio2, m2, hoy.minusDays(27), vencimiento);

        when(socioMembresiaRepository.findMembresiasPorVencerEnFecha(vencimiento))
                .thenReturn(List.of(sm1, sm2));

        when(emailService.construirPlantillaPorVencer(anyString(), anyString(), any(LocalDate.class)))
                .thenReturn("<html>contenido</html>");
        
        // El primero retorna false (falló) y el segundo true
        when(emailService.enviarMailHtml(eq("invalido@"), anyString(), anyString())).thenReturn(false);
        when(emailService.enviarMailHtml(eq("ana@test.com"), anyString(), anyString())).thenReturn(true);

        int total = membresiaNotificacionJob.procesarMembresiasPorVencer(hoy);

        assertEquals(1, total);
        verify(emailService, times(2)).enviarMailHtml(anyString(), anyString(), anyString());
    }

    @Test
    void procesarMembresiasVencidas_conMembresiasValidas_enviaEmails() {
        LocalDate hoy = LocalDate.now();
        LocalDate vencida = hoy.minusDays(1);

        Socio socio = new Socio("33333333", "Carlos Garcia", "777888", "carlos@test.com", LocalDate.of(1988, 3, 3));
        Membresia m = new Membresia("Pase Mensual", 30, new BigDecimal("25000"));
        SocioMembresia sm = new SocioMembresia(socio, m, hoy.minusDays(31), vencida);

        when(socioMembresiaRepository.findMembresiasVencidasEnFecha(vencida, hoy))
                .thenReturn(List.of(sm));

        when(emailService.construirPlantillaVencida(anyString(), anyString(), any(LocalDate.class)))
                .thenReturn("<html>contenido vencido</html>");
        when(emailService.enviarMailHtml(anyString(), anyString(), anyString()))
                .thenReturn(true);

        int total = membresiaNotificacionJob.procesarMembresiasVencidas(hoy);

        assertEquals(1, total);
        verify(emailService, times(1)).enviarMailHtml(eq("carlos@test.com"), contains("finalizado"), anyString());
    }

    @Test
    void ejecutarNotificacionesDiarias_ejecutaAmbosProcesos() {
        LocalDate hoy = LocalDate.now();
        when(socioMembresiaRepository.findMembresiasPorVencerEnFecha(any(LocalDate.class)))
                .thenReturn(Collections.emptyList());
        when(socioMembresiaRepository.findMembresiasVencidasEnFecha(any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(Collections.emptyList());

        membresiaNotificacionJob.ejecutarNotificacionesDiarias();

        verify(socioMembresiaRepository, times(1)).findMembresiasPorVencerEnFecha(hoy.plusDays(3));
        verify(socioMembresiaRepository, times(1)).findMembresiasVencidasEnFecha(hoy.minusDays(1), hoy);
    }
}
