package com.nexo.gestion;

import com.nexo.gestion.entity.*;
import com.nexo.gestion.repository.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.annotation.Rollback;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
public class RutinaTest {
    @Autowired SocioRepository socioRepository;
    @Autowired EjercicioRepository ejercicioRepository;
    @Autowired RutinaRepository rutinaRepository;
    @Autowired RutinaDetalleRepository rutinaDetalleRepository;
    @Autowired EmpleadoRepository empleadoRepository;
    @Autowired GrupoMuscularRepository grupoMuscularRepository;
    @Autowired PuestoRepository puestoRepository;

    @Test
    @Transactional
    @Rollback
    public void verificarQueSeGuardaEjercicio() {
        GrupoMuscular pecho = new GrupoMuscular("pecho");
        grupoMuscularRepository.save(pecho);
        Ejercicio ejercicio = new Ejercicio("Press plano", pecho);
        Ejercicio guardado = ejercicioRepository.save(ejercicio);

        assertNotNull(guardado.getIdEjercicio());
        assertEquals("Press plano", guardado.getNombre());
        assertEquals(pecho.getIdGrupo(), guardado.getGrupoMuscular().getIdGrupo());
    }

    @Test
    @Transactional
    @Rollback
    public void verificarQueSeGuardaRutina() {
        Puesto puesto = new Puesto("Profesor");
        puestoRepository.save(puesto);
        Empleado empleado = new Empleado("37895175", "Felipe", "1156687896", "felipruski@gmail.com",
                LocalDate.of(2001, 8, 4), puesto);
        empleadoRepository.save(empleado);
        Rutina rutina = new Rutina("Musculacion", "muscular los musculos", empleado);
        Rutina guardado = rutinaRepository.save(rutina);

        assertNotNull(guardado.getIdRutina());
        assertEquals("Musculacion", guardado.getNombre());
        assertEquals("muscular los musculos", guardado.getDescripcion());
        assertEquals("Felipe", guardado.getEmpleado().getNombre());
    }

    @Test
    @Transactional
    @Rollback
    public void verificarQueSeGuardaRutinaConDetalle() {
        // Setup
        GrupoMuscular pecho = new GrupoMuscular("pecho rt");
        grupoMuscularRepository.save(pecho);
        Ejercicio ejercicio = new Ejercicio("Press inclinado rt", pecho);
        ejercicioRepository.save(ejercicio);

        Puesto puesto = new Puesto("Profesor RT");
        puestoRepository.save(puesto);
        Empleado empleado = new Empleado("37895100", "Coach", "1156687800", "coach_rt@gmail.com",
                LocalDate.of(2001, 8, 4), puesto);
        empleadoRepository.save(empleado);

        Rutina rutina = new Rutina("Rutina Pecho RT", "dia de pecho", empleado);
        RutinaDetalle detalle = new RutinaDetalle(rutina, ejercicio, 1, "4", "12", "20kg", "60", null, 1);
        rutina.agregarDetalle(detalle);

        Rutina guardada = rutinaRepository.save(rutina);

        assertNotNull(guardada.getIdRutina());
        assertFalse(guardada.getDetalles().isEmpty(), "La rutina debería tener detalles");
        assertEquals(1, guardada.getDetalles().size());
        assertEquals("Press inclinado rt", guardada.getDetalles().get(0).getEjercicio().getNombre());
        assertEquals("4", guardada.getDetalles().get(0).getSeries());
    }

    @Test
    @Transactional
    @Rollback
    public void verificarQueRutinaPuedeAsignarseASocio() {
        Puesto puesto = new Puesto("Profesor RS");
        puestoRepository.save(puesto);
        Empleado empleado = new Empleado("37895101", "CoachRS", "1156687801", "coachrs@gmail.com",
                LocalDate.of(2001, 8, 4), puesto);
        empleadoRepository.save(empleado);

        Socio socio = new Socio("44048601", "MateoRS", "1111111101", "mateors@test.com", LocalDate.of(2000, 1, 1));
        socioRepository.save(socio);

        Rutina rutina = new Rutina("Rutina Personal RS", "para socio", empleado, socio);
        Rutina guardada = rutinaRepository.save(rutina);

        assertNotNull(guardada.getIdRutina());
        assertNotNull(guardada.getSocio());
        assertEquals("44048601", guardada.getSocio().getDni());
    }
}
