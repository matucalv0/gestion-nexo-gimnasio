package com.nexo.gestion;

import com.nexo.gestion.entity.*;
import com.nexo.gestion.repository.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.annotation.Rollback;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertNotNull;

@SpringBootTest
public class RutinaTest {
    @Autowired
    SocioRepository socioRepository;
    @Autowired
    EjercicioRepository ejercicioRepository;
    @Autowired
    RutinaRepository rutinaRepository;
    @Autowired
    RutinaDetalleRepository rutinaDetalleRepository;
    @Autowired
    EmpleadoRepository empleadoRepository;
    @Autowired
    GrupoMuscularRepository grupoMuscularRepository;
    @Autowired
    PuestoRepository puestoRepository;

    @Test
    @Transactional
    @Rollback
    public void verificarQueSeGuardaEjercicio() {
        GrupoMuscular pecho = new GrupoMuscular("pecho");
        grupoMuscularRepository.save(pecho);
        Ejercicio ejercicio = new Ejercicio("Press plano", pecho);
        Ejercicio guardado = ejercicioRepository.save(ejercicio);
        assertNotNull(guardado.getIdEjercicio());

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

    }


}
