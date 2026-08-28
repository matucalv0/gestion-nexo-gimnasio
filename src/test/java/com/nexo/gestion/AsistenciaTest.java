package com.nexo.gestion;

import com.nexo.gestion.dto.*;
import com.nexo.gestion.entity.*;
import com.nexo.gestion.exceptions.AsistenciaDiariaException;
import com.nexo.gestion.exceptions.MembresiaVencidaException;
import com.nexo.gestion.exceptions.SocioInactivoException;
import com.nexo.gestion.exceptions.SocioSinAsistenciasDisponiblesException;
import com.nexo.gestion.repository.AsistenciaRepository;
import com.nexo.gestion.repository.SocioMembresiaRepository;
import com.nexo.gestion.services.MembresiaService;
import com.nexo.gestion.services.SocioService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.annotation.Rollback;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
public class AsistenciaTest {
    @Autowired
    SocioService socioService;
    @Autowired
    MembresiaService membresiaService;
    @Autowired
    SocioMembresiaRepository socioMembresiaRepository;
    @Autowired
    AsistenciaRepository asistenciaRepository;


    private SocioDTO crearSocioConMembresiaActiva() {
        Socio socio = new Socio("78452365", "Eduardo", "11478523211",
                "edu@gmail.com", LocalDate.of(1986,1,28));

        SocioDTO socioGuardado = socioService.registrarSocio(
                new SocioCreateDTO(
                        socio.getDni(),
                        socio.getNombre(),
                        socio.getTelefono(),
                        socio.getEmail(),
                        socio.getFechaNacimiento()
                )
        );

        MembresiaDTO membresia = membresiaService.registrarMembresia(
                new MembresiaCreateDTO(
                        28,
                        new BigDecimal("50000"),
                        "plan basico",
                        2,
                        TipoMembresia.MUSCULACION
                )
        );

        socioService.asignarMembresia(socioGuardado.dni(), membresia.idMembresia());

        return socioGuardado;
    }



    @Test
    @Transactional
    @Rollback
    public void verificarQueSeRegistraAsistencia(){
        Socio socio = new Socio("78452365", "Eduardo", "11478523211", "edu@gmail.com", LocalDate.of(1986,1,28));
        SocioDTO socioGuardado = socioService.registrarSocio(new SocioCreateDTO(socio.getDni(), socio.getNombre(), socio.getTelefono(), socio.getEmail(), socio.getFechaNacimiento()));
        Membresia membresia = new Membresia("plan basico", 28, new BigDecimal(50000), 2, TipoMembresia.MUSCULACION);
        MembresiaDTO guardada = membresiaService.registrarMembresia(new MembresiaCreateDTO(membresia.getDuracionDias(), membresia.getPrecioSugerido(), membresia.getNombre(), membresia.getAsistenciasPorSemana(), membresia.getTipoMembresia()));

        socioService.asignarMembresia(socioGuardado.dni(), guardada.idMembresia());

        assertDoesNotThrow(() ->
                socioService.registrarAsistencia(socioGuardado.dni())
        );

    }

    @Test
    @Transactional
    @Rollback
    public void verificarQueNoSeRegistraAsistenciaSiElSocioNoTieneMembresia() {
        Socio socio = new Socio("78452365", "Eduardo", "11478523211", "edu@gmail.com", LocalDate.of(1986, 1, 28));
        socioService.registrarSocio(new SocioCreateDTO(socio.getDni(), socio.getNombre(), socio.getTelefono(), socio.getEmail(), socio.getFechaNacimiento()));

        AsistenciaSocioIdDTO asistencia = socioService.registrarAsistencia(socio.getDni());
        Asistencia asistencias = asistenciaRepository.findById(new AsistenciaSocioId(asistencia.dniSocio(), asistencia.fechaHora())).get();
        assertEquals(EstadoAsistencia.PENDIENTE, asistencias.getEstadoAsistencia());
    }

    @Test
    @Transactional
    @Rollback
    public void verificarQueNoSeRegistraLaAsistenciaSiElSocioTieneMembresiaVencida(){
        Socio socio = new Socio("78452365", "Eduardo", "11478523211", "edu@gmail.com", LocalDate.of(1986,1,28));
        SocioDTO socioGuardado = socioService.registrarSocio(new SocioCreateDTO(socio.getDni(), socio.getNombre(), socio.getTelefono(), socio.getEmail(), socio.getFechaNacimiento()));
        Membresia membresia = new Membresia("plan basico", 28, new BigDecimal(50000), 2, TipoMembresia.MUSCULACION);
        MembresiaDTO guardada = membresiaService.registrarMembresia(new MembresiaCreateDTO(membresia.getDuracionDias(), membresia.getPrecioSugerido(), membresia.getNombre(), membresia.getAsistenciasPorSemana(), membresia.getTipoMembresia()));

        socioService.asignarMembresia(socioGuardado.dni(), guardada.idMembresia());
        SocioMembresia suscripcionGuardada = socioMembresiaRepository.findActivaBySocio(socioGuardado.dni()).get();

        suscripcionGuardada.setFechaInicio(LocalDate.of(2025, 11, 1));
        suscripcionGuardada.setFechaHasta(LocalDate.of(2025,12,1));
        socioMembresiaRepository.saveAndFlush(suscripcionGuardada);

        AsistenciaSocioIdDTO asistencia = socioService.registrarAsistencia(socioGuardado.dni());
        Asistencia asistencias = asistenciaRepository.findById(new AsistenciaSocioId(asistencia.dniSocio(), asistencia.fechaHora())).get();
        assertEquals(EstadoAsistencia.PENDIENTE, asistencias.getEstadoAsistencia());
    }

    @Test
    @Transactional
    @Rollback
    public void verificarQueNoSeRegistraLaAsistenciaSiElSocioYaCumplioElTotalMensual(){
        Socio socio = new Socio("78452365", "Eduardo", "11478523211", "edu@gmail.com", LocalDate.of(1986,1,28));
        SocioDTO socioGuardado = socioService.registrarSocio(new SocioCreateDTO(socio.getDni(), socio.getNombre(), socio.getTelefono(), socio.getEmail(), socio.getFechaNacimiento()));
        Membresia membresia = new Membresia("plan basico", 28, new BigDecimal(50000), 2, TipoMembresia.MUSCULACION);
        MembresiaDTO guardada = membresiaService.registrarMembresia(new MembresiaCreateDTO(membresia.getDuracionDias(), membresia.getPrecioSugerido(), membresia.getNombre(), membresia.getAsistenciasPorSemana(), membresia.getTipoMembresia()));

        socioService.asignarMembresia(socioGuardado.dni(), guardada.idMembresia());

        // Backdate membership so past attendances count
        SocioMembresia sm = socioMembresiaRepository.findActivaBySocio(socioGuardado.dni()).get();
        sm.setFechaInicio(LocalDate.now().minusMonths(1));
        socioMembresiaRepository.saveAndFlush(sm);

        for (int i = 1; i <= 8; i++) {
            Asistencia a = new Asistencia(socio, true);
            AsistenciaSocioId id = new AsistenciaSocioId(socio.getDni(), java.time.LocalDateTime.now().minusDays(i));
            a.setIdAsistencia(id);
            a.setEstadoAsistencia(EstadoAsistencia.VALIDA);
            asistenciaRepository.save(a);
        }

        assertThrows(SocioSinAsistenciasDisponiblesException.class, () -> socioService.registrarAsistencia(socioGuardado.dni()));

    }


    @Test
    @Transactional
    @Rollback
    public void noPermiteRegistrarMasAsistenciasCuandoLlegaACero() {
        Socio socio = new Socio("78452365", "Eduardo", "11478523211", "edu@gmail.com", LocalDate.of(1986,1,28));
        SocioDTO socioGuardado = socioService.registrarSocio(new SocioCreateDTO(socio.getDni(), socio.getNombre(), socio.getTelefono(), socio.getEmail(), socio.getFechaNacimiento()));
        Membresia membresia = new Membresia("plan basico", 28, new BigDecimal(50000), 2, TipoMembresia.MUSCULACION);
        MembresiaDTO guardada = membresiaService.registrarMembresia(new MembresiaCreateDTO(membresia.getDuracionDias(), membresia.getPrecioSugerido(), membresia.getNombre(), membresia.getAsistenciasPorSemana(), membresia.getTipoMembresia()));

        socioService.asignarMembresia(socioGuardado.dni(), guardada.idMembresia());

        // Backdate membership so past attendances count
        SocioMembresia sm = socioMembresiaRepository.findActivaBySocio(socioGuardado.dni()).get();
        sm.setFechaInicio(LocalDate.now().minusMonths(1));
        socioMembresiaRepository.saveAndFlush(sm);

        int diasAtras = 1;
        while (socioService.asistenciasDisponibles(socioGuardado.dni()) > 0) {
            Asistencia a = new Asistencia(socio, true);
            AsistenciaSocioId id = new AsistenciaSocioId(socio.getDni(), java.time.LocalDateTime.now().minusDays(diasAtras));
            a.setIdAsistencia(id);
            a.setEstadoAsistencia(EstadoAsistencia.VALIDA);
            asistenciaRepository.save(a);
            diasAtras++;
            
            if (diasAtras > 30) break; // Circuit breaker just in case
        }

        assertThrows(SocioSinAsistenciasDisponiblesException.class, () -> socioService.registrarAsistencia(socioGuardado.dni()));
    }

    @Test
    @Transactional
    @Rollback
    public void verificarQueNoPermiteRegistrarMasDeUnaAsistenciaEnUnMismoDia(){
        Socio socio = new Socio("78452365", "Eduardo", "11478523211", "edu@gmail.com", LocalDate.of(1986,1,28));
        SocioDTO socioGuardado = socioService.registrarSocio(new SocioCreateDTO(socio.getDni(), socio.getNombre(), socio.getTelefono(), socio.getEmail(), socio.getFechaNacimiento()));
        Membresia membresia = new Membresia("plan basico", 28, new BigDecimal(50000), 2, TipoMembresia.MUSCULACION);
        MembresiaDTO guardada = membresiaService.registrarMembresia(new MembresiaCreateDTO(membresia.getDuracionDias(), membresia.getPrecioSugerido(), membresia.getNombre(), membresia.getAsistenciasPorSemana(), membresia.getTipoMembresia()));

        socioService.asignarMembresia(socioGuardado.dni(), guardada.idMembresia());

        socioService.registrarAsistencia(socioGuardado.dni());  //registro una asistencia

        assertThrows(AsistenciaDiariaException.class, () -> socioService.registrarAsistencia(socioGuardado.dni()));

    }



    @Test
    @Transactional
    @Rollback
    public void verificarQueSeRegistraAsistenciaConMembresiasEncadenadasAFuturo() {
        Socio socio = new Socio("88990011", "Lucas", "1133445566", "lucas@gmail.com", LocalDate.of(1995, 3, 10));
        SocioDTO socioGuardado = socioService.registrarSocio(
                new SocioCreateDTO(socio.getDni(), socio.getNombre(), socio.getTelefono(), socio.getEmail(), socio.getFechaNacimiento())
        );

        Membresia membresia = new Membresia("Plan Pase Libre", 30, new BigDecimal("60000"), 0, TipoMembresia.MUSCULACION);
        MembresiaDTO guardada = membresiaService.registrarMembresia(
                new MembresiaCreateDTO(membresia.getDuracionDias(), membresia.getPrecioSugerido(), membresia.getNombre(), membresia.getAsistenciasPorSemana(), membresia.getTipoMembresia())
        );

        // Membresía 1: Inicia hoy y vence en 30 días
        SocioMembresia sm1 = new SocioMembresia(socio, membresia, LocalDate.now(), LocalDate.now().plusDays(30));
        socioMembresiaRepository.saveAndFlush(sm1);

        // Membresía 2 (encadenada a futuro): Inicia en 31 días y vence en 60 días
        SocioMembresia sm2 = new SocioMembresia(socio, membresia, LocalDate.now().plusDays(31), LocalDate.now().plusDays(60));
        socioMembresiaRepository.saveAndFlush(sm2);

        // Verificar que la membresía activa HOY es la primera (que cubre hoy)
        Optional<SocioMembresia> activaHoyOpt = socioMembresiaRepository.findActivaBySocio(socioGuardado.dni());
        assertTrue(activaHoyOpt.isPresent());
        assertEquals(sm1.getIdSm(), activaHoyOpt.get().getIdSm());
        assertTrue(activaHoyOpt.get().cubre(LocalDate.now()));

        // Verificar asistencias disponibles (ilimitadas para pase libre)
        int disponibles = socioService.asistenciasDisponibles(socioGuardado.dni());
        assertEquals(Integer.MAX_VALUE, disponibles);

        // Registrar asistencia: NO debe lanzar MembresiaVencidaException y debe quedar como VALIDA
        AsistenciaSocioIdDTO asistencia = socioService.registrarAsistencia(socioGuardado.dni());
        assertNotNull(asistencia);
        Asistencia asistenciaDB = asistenciaRepository.findById(new AsistenciaSocioId(asistencia.dniSocio(), asistencia.fechaHora())).get();
        assertEquals(EstadoAsistencia.VALIDA, asistenciaDB.getEstadoAsistencia());

        // Verificar membresia vigente DTO (debe tener el nombre del plan y la fecha de vencimiento total encadenada)
        MembresiaVigenteDTO vigenteDTO = socioService.membresiaVigenteSocio(socioGuardado.dni());
        assertNotNull(vigenteDTO);
        assertEquals("Plan Pase Libre", vigenteDTO.tipo());
        assertEquals(LocalDate.now().plusDays(60), vigenteDTO.vencimiento());

        // Verificar días restantes calculados contra la fecha máxima encadenada
        Integer diasRestantes = socioService.diasParaVencimientoMembresiaVigente(socioGuardado.dni());
        assertNotNull(diasRestantes);
        assertEquals(60, diasRestantes);
    }
}
