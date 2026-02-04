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




}
