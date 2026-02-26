package com.nexo.gestion;

import com.nexo.gestion.entity.Asistencia;
import com.nexo.gestion.entity.Membresia;
import com.nexo.gestion.entity.Socio;
import com.nexo.gestion.entity.SocioMembresia;
import com.nexo.gestion.repository.AsistenciaRepository;
import com.nexo.gestion.repository.MembresiaRepository;
import com.nexo.gestion.repository.SocioMembresiaRepository;
import com.nexo.gestion.repository.SocioRepository;
import com.nexo.gestion.dto.SocioCreateDTO;
import com.nexo.gestion.dto.SocioDTO;
import com.nexo.gestion.dto.MembresiaCreateDTO;
import com.nexo.gestion.dto.MembresiaDTO;
import com.nexo.gestion.services.SocioService;
import com.nexo.gestion.services.MembresiaService;
import com.nexo.gestion.entity.TipoMembresia;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.annotation.Rollback;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

@SpringBootTest
public class SocioTest {
    @Autowired
    private SocioRepository socioRepository;
    @Autowired
    private MembresiaRepository membresiaRepository;
    @Autowired
    private SocioMembresiaRepository socioMembresiaRepository;
    @Autowired
    private AsistenciaRepository asistenciaRepository;
    @Autowired
    private SocioService socioService;
    @Autowired
    private MembresiaService membresiaService;


    @Test
    @Transactional
    @Rollback
    public void verificarQueSeGuardaSocio(){
        Socio socio = new Socio("44048664", "Mateo", "1111111111", "mateo@test.com", LocalDate.of(2000, 1, 1));
        Socio guardado = socioRepository.save(socio);
        assertNotNull(guardado.getDni());
    }

    @Test
    @Transactional
    @Rollback
    public void verificarQueSeGuardaMembresia(){
        Membresia membresia1 = new Membresia("Estandar", 30, BigDecimal.valueOf(30000.00));
        Membresia guardado = membresiaRepository.save(membresia1);
        assertNotNull(guardado.getIdMembresia());

    }

    @Test
    @Transactional
    @Rollback
    public void verificarSocioMembresia(){
        Membresia membresia1 = new Membresia("Estandar", 30, BigDecimal.valueOf(30000.00));
        Socio socio = new Socio("44048664", "Mateo", "1156686238", "matucalv@gmail.com", LocalDate.of(2002,1,28));
        socioRepository.save(socio);
        membresiaRepository.save(membresia1);

        SocioMembresia nuevaSuscripcion = new SocioMembresia(socio, membresia1);


        socio.agregarMembresia(nuevaSuscripcion);
        membresia1.agregarSocio(nuevaSuscripcion);
        socioRepository.save(socio);
        membresiaRepository.save(membresia1);

        socioMembresiaRepository.save(nuevaSuscripcion);
        SocioMembresia guardado = socioMembresiaRepository.save(nuevaSuscripcion);


        assertNotNull(guardado.getIdSm());
        assertEquals(guardado.getFechaHasta(), guardado.getFechaInicio().plusDays(30)); //verifico cálculo de fechaHasta
        System.out.println(guardado.getSocio().getNombre());
        System.out.println(guardado.getMembresia().getNombre());
        System.out.println(guardado.getFechaInicio());
        System.out.println(guardado.getFechaHasta());
    }

    @Test
    @Transactional
    @Rollback
    public void verificarAsistenciaSocio(){
        Socio socio = new Socio("44048664", "Mateo", "1156686238", "matucalv@gmail.com", LocalDate.of(2002,1,28));
        socioRepository.save(socio);
        Asistencia nuevaAsistencia = new Asistencia(socio, true);
        Asistencia guardado = asistenciaRepository.save(nuevaAsistencia);


        System.out.println(guardado.getIdAsistencia());
        assertNotNull(guardado.getIdAsistencia());

    }

    @Test
    @Transactional
    @Rollback
    public void verificarFiltradoPorEstado(){
        // Crear membresía base
        Membresia membresiaBase = new Membresia("Base", 30, BigDecimal.valueOf(1000));
        membresiaRepository.save(membresiaBase);

        // Crear socio ACTIVO (con membresía vigente)
        Socio activo = new Socio("11111111", "Socio Activo", "11111", "activo@test.com", LocalDate.of(1990, 1, 1));
        SocioDTO guardado = socioService.registrarSocio(new SocioCreateDTO(activo.getDni(), activo.getNombre(), activo.getTelefono(), activo.getEmail(), activo.getFechaNacimiento()));
        Membresia membresiaParaAsignar = new Membresia("plan basico", 28, new BigDecimal(50000), 2, TipoMembresia.MUSCULACION);
        MembresiaDTO memGuardada = membresiaService.registrarMembresia(new MembresiaCreateDTO(membresiaParaAsignar.getDuracionDias(), membresiaParaAsignar.getPrecioSugerido(), membresiaParaAsignar.getNombre(), membresiaParaAsignar.getAsistenciasPorSemana(), membresiaParaAsignar.getTipoMembresia()));
        socioService.asignarMembresia(guardado.dni(), memGuardada.idMembresia());

        // Crear socio INACTIVO (sin membresía vigente)
        Socio inactivo = new Socio("22222222", "Socio Inactivo", "22222", "inactivo@test.com", LocalDate.of(1990, 1, 1));
        inactivo.setActivo(true); // El flag booleano no debería importar
        socioRepository.save(inactivo);
        
        // Membresía vencida
        SocioMembresia smVencida = new SocioMembresia(inactivo, membresiaBase);
        smVencida.setFechaInicio(LocalDate.now().minusDays(60));
        smVencida.setFechaHasta(LocalDate.now().minusDays(30));
        socioMembresiaRepository.save(smVencida);

        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(0, 10);

        // Test filtro Activos (true) buscando el DNI específico
        org.springframework.data.domain.Page<Socio> resultadosActivos = 
            socioRepository.buscarSociosPaginados("11111111", true, pageable);
        
        long countActivos = resultadosActivos.getContent().stream().filter(s -> s.getDni().equals("11111111")).count();
        assertEquals(1, countActivos, "Debería encontrar al socio con membresía vigente");

        org.springframework.data.domain.Page<Socio> resultadosActivosInvalido = 
            socioRepository.buscarSociosPaginados("22222222", true, pageable);
        assertEquals(0, resultadosActivosInvalido.getTotalElements(), "No debería encontrar al socio inactivo");

        // Test filtro Inactivos (false) buscando el DNI específico
        org.springframework.data.domain.Page<Socio> resultadosInactivos = 
            socioRepository.buscarSociosPaginados("22222222", false, pageable);
        
        long countInactivos = resultadosInactivos.getContent().stream().filter(s -> s.getDni().equals("22222222")).count();
        assertEquals(1, countInactivos, "Debería encontrar al socio con membresía vencida");

        org.springframework.data.domain.Page<Socio> resultadosInactivosInvalido = 
            socioRepository.buscarSociosPaginados("11111111", false, pageable);
        assertEquals(0, resultadosInactivosInvalido.getTotalElements(), "No debería encontrar al socio activo");

        // Test sin filtro (null)
        org.springframework.data.domain.Page<Socio> resultadosTodosUno = 
            socioRepository.buscarSociosPaginados("11111111", null, pageable);
        assertEquals(1, resultadosTodosUno.getContent().size(), "Debería encontrar al socio activo en búsqueda total");

        org.springframework.data.domain.Page<Socio> resultadosTodosDos = 
            socioRepository.buscarSociosPaginados("22222222", null, pageable);
        assertEquals(1, resultadosTodosDos.getContent().size(), "Debería encontrar al socio inactivo en búsqueda total");
    }
}
