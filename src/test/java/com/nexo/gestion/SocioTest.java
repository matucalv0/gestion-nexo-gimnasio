package com.nexo.gestion;

import com.nexo.gestion.entity.Asistencia;
import com.nexo.gestion.entity.Membresia;
import com.nexo.gestion.entity.Socio;
import com.nexo.gestion.entity.SocioMembresia;
import com.nexo.gestion.repository.AsistenciaRepository;
import com.nexo.gestion.repository.MembresiaRepository;
import com.nexo.gestion.repository.SocioMembresiaRepository;
import com.nexo.gestion.repository.SocioRepository;
import org.checkerframework.checker.units.qual.A;
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


    @Test
    @Transactional
    @Rollback
    public void verificarQueSeGuardaSocio(){
        Socio socio = new Socio("44048664", "Mateo");
        Socio guardado = socioRepository.save(socio);
        assertNotNull(guardado.getDni());
    }

    @Test
    @Transactional
    @Rollback
    public void verificarQueSeGuardaMembresia(){
        Membresia membresia1 = new Membresia("Estandar", 30, BigDecimal.valueOf(30000.00));
        Membresia guardado = membresiaRepository.save(membresia1);
        assertNotNull(guardado.getId_membresia());

    }

    @Test
    @Transactional
    @Rollback
    public void verificarSocioMembresia(){
        Membresia membresia1 = new Membresia("Estandar", 30, BigDecimal.valueOf(30000.00));
        Socio socio = new Socio("44048664", "Mateo", "1156686238", "matucalv@gmail.com", LocalDate.of(2002,1,28));
        socioRepository.save(socio);
        membresiaRepository.save(membresia1);

        SocioMembresia nuevaSuscripcion = new SocioMembresia(BigDecimal.valueOf(30000.00), socio, membresia1);


        socio.agregarMembresia(nuevaSuscripcion);
        membresia1.agregarSocio(nuevaSuscripcion);
        socioRepository.save(socio);
        membresiaRepository.save(membresia1);

        socioMembresiaRepository.save(nuevaSuscripcion);
        SocioMembresia guardado = socioMembresiaRepository.save(nuevaSuscripcion);


        assertNotNull(guardado.getId_sm());
        assertEquals(guardado.getFecha_hasta(), guardado.getFecha_inicio().plusDays(30)); //verifico cálculo de fecha_hasta
        System.out.println(guardado.getSocio().getNombre());
        System.out.println(guardado.getMembresia().getNombre());
        System.out.println(guardado.getFecha_inicio());
        System.out.println(guardado.getFecha_hasta());
    }

    @Test
    @Transactional
    @Rollback
    public void verificarAsistenciaSocio(){
        Socio socio = new Socio("44048664", "Mateo", "1156686238", "matucalv@gmail.com", LocalDate.of(2002,1,28));
        socioRepository.save(socio);
        Asistencia nuevaAsistencia = new Asistencia(socio);
        Asistencia guardado = asistenciaRepository.save(nuevaAsistencia);


        System.out.println(guardado.getId_asistencia());
        assertNotNull(guardado.getId_asistencia());

    }

}
