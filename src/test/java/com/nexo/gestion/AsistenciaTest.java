package com.nexo.gestion;

import com.nexo.gestion.dto.*;
import com.nexo.gestion.entity.*;
import com.nexo.gestion.exceptions.MembresiaVencidaException;
import com.nexo.gestion.exceptions.SocioInactivoException;
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

        assertThrows(SocioInactivoException.class, () -> socioService.registrarAsistencia(socio.getDni()));

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
        socioMembresiaRepository.save(suscripcionGuardada);

        assertThrows(MembresiaVencidaException.class, () -> socioService.registrarAsistencia(socioGuardado.dni()));

    }

}
