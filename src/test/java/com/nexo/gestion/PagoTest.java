package com.nexo.gestion;

import com.nexo.gestion.dto.*;
import com.nexo.gestion.entity.*;
import com.nexo.gestion.exceptions.MasDeUnaMembresiaEnDetalleException;
import com.nexo.gestion.repository.*;
import com.nexo.gestion.services.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.annotation.Rollback;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
public class PagoTest {
    @Autowired
    private PagoRepository pagoRepository;
    @Autowired
    private SocioRepository socioRepository;
    @Autowired
    private MedioPagoRepository medioPagoRepository;
    @Autowired
    private EmpleadoRepository empleadoRepository;
    @Autowired
    private PuestoRepository puestoRepository;
    @Autowired
    private DetallePagoRepository detallePagoRepository;
    @Autowired
    private MembresiaRepository membresiaRepository;
    @Autowired
    private SocioMembresiaRepository socioMembresiaRepository;
    @Autowired
    private ProductoRepository productoRepository;
    @Autowired
    private PagoService pagoService;
    @Autowired
    private SocioService socioService;
    @Autowired
    private MedioPagoService medioPagoService;
    @Autowired
    private EmpleadoService empleadoService;
    @Autowired
    private PuestoService puestoService;
    @Autowired
    private MembresiaService membresiaService;
    @Autowired
    private ProductoService productoService;


    @Test
    @Transactional
    @Rollback
    public void verificarQueSeGuardaPago(){
        Puesto puesto = new Puesto("Profesor");
        puestoRepository.save(puesto);
        Socio socio = new Socio("44048664", "Mateo", "1156686238", "matucalv@gmail.com", LocalDate.of(2002,1,28));
        socioRepository.save(socio);
        MedioPago medioPago = new MedioPago("Mercado Pete");
        medioPagoRepository.save(medioPago);
        Empleado empleado = new Empleado("37895175", "Felipe", "1156687896", "felipruski@gmail.com", LocalDate.of(2001,8,4), puesto);
        empleadoRepository.save(empleado);


        Pago pago = new Pago(EstadoPago.PAGADO, BigDecimal.valueOf(34000), socio, medioPago, empleado);
        Pago guardado = pagoRepository.save(pago);

        assertNotNull(guardado.getIdPago());
    }

    @Test
    @Transactional
    @Rollback
    public void verificarDetallesEnPago(){
        Socio socio = new Socio("78452365", "Eduardo", "11478523211", "edu@gmail.com", LocalDate.of(1986,1,28));
        SocioDTO socioGuardado = socioService.registrarSocio(new SocioCreateDTO(socio.getDni(), socio.getNombre(), socio.getTelefono(), socio.getEmail(), socio.getFechaNacimiento()));

        Membresia membresia = new Membresia("plan basico", 28, new BigDecimal(50000), 2, TipoMembresia.MUSCULACION);
        MembresiaDTO guardada = membresiaService.registrarMembresia(new MembresiaCreateDTO(membresia.getDuracionDias(), membresia.getPrecioSugerido(), membresia.getNombre(), membresia.getAsistenciasPorSemana(), membresia.getTipoMembresia()));

        MedioPago medioPago = new MedioPago("TRANSFERENCIA");
        MedioPagoDTO medioPagoGuardado = medioPagoService.registrarMedioPago(new MedioPagoDTO(medioPago.getNombre()));

        Puesto puesto = new Puesto("Instructor");
        PuestoDTO puestoGuardado = puestoService.registrarPuesto(new PuestoDTO(puesto.getNombre()));

        Empleado empleado = new Empleado("37895175", "Felipe", "1156687896", "felipruski@gmail.com", LocalDate.of(2001,8,4));
        EmpleadoDTO empleadoGuardado = empleadoService.registrarEmpleado(new EmpleadoDTO(empleado.getDni(), empleado.getNombre(), empleado.getTelefono(), empleado.getEmail(), empleado.getFechaNacimiento(), empleado.isActivo(), puestoGuardado.idPuesto()));

        DetallePagoCreateDTO[] detalle = {new DetallePagoCreateDTO(1, BigDecimal.valueOf(25000), null,  socioGuardado.dni(), guardada.idMembresia())};
        PagoDTO pagoGuardado = pagoService.crearPago(new PagoCreateDTO(EstadoPago.PAGADO, socioGuardado.dni(), medioPagoGuardado.idMedioPago(), empleadoGuardado.dni(), List.of(detalle)));

        assertFalse(pagoGuardado.detalles().isEmpty());

    }

    @Test
    @Transactional
    @Rollback
    public void verificarQueNoSeRegistraPagoSiHayMasDeUnaMembresiaEnElDetalle(){
        Socio socio = new Socio("78452365", "Eduardo", "11478523211", "edu@gmail.com", LocalDate.of(1986,1,28));
        SocioDTO socioGuardado = socioService.registrarSocio(new SocioCreateDTO(socio.getDni(), socio.getNombre(), socio.getTelefono(), socio.getEmail(), socio.getFechaNacimiento()));

        Membresia membresia = new Membresia("plan basico", 28, new BigDecimal(50000), 2, TipoMembresia.MUSCULACION);
        MembresiaDTO guardada = membresiaService.registrarMembresia(new MembresiaCreateDTO(membresia.getDuracionDias(), membresia.getPrecioSugerido(), membresia.getNombre(), membresia.getAsistenciasPorSemana(), membresia.getTipoMembresia()));

        MedioPago medioPago = new MedioPago("TRANSFERENCIA");
        MedioPagoDTO medioPagoGuardado = medioPagoService.registrarMedioPago(new MedioPagoDTO(medioPago.getNombre()));

        Puesto puesto = new Puesto("Instructor");
        PuestoDTO puestoGuardado = puestoService.registrarPuesto(new PuestoDTO(puesto.getNombre()));

        Empleado empleado = new Empleado("37895175", "Felipe", "1156687896", "felipruski@gmail.com", LocalDate.of(2001,8,4));
        EmpleadoDTO empleadoGuardado = empleadoService.registrarEmpleado(new EmpleadoDTO(empleado.getDni(), empleado.getNombre(), empleado.getTelefono(), empleado.getEmail(), empleado.getFechaNacimiento(), empleado.isActivo(), puestoGuardado.idPuesto()));

        DetallePagoCreateDTO[] detalle = {new DetallePagoCreateDTO(1, BigDecimal.valueOf(25000), null,  socioGuardado.dni(), guardada.idMembresia()),
                                          new DetallePagoCreateDTO(1, BigDecimal.valueOf(25000), null,  socioGuardado.dni(), guardada.idMembresia())};


        assertThrows(MasDeUnaMembresiaEnDetalleException.class, ()-> pagoService.crearPago(new PagoCreateDTO(EstadoPago.PAGADO, socioGuardado.dni(), medioPagoGuardado.idMedioPago(), empleadoGuardado.dni(), List.of(detalle))));

    }

    @Test
    @Transactional
    @Rollback
    public void verificarQueSeAsignaMembresiaAlPagar(){
        Socio socio = new Socio("78452365", "Eduardo", "11478523211", "edu@gmail.com", LocalDate.of(1986,1,28));
        SocioDTO socioGuardado = socioService.registrarSocio(new SocioCreateDTO(socio.getDni(), socio.getNombre(), socio.getTelefono(), socio.getEmail(), socio.getFechaNacimiento()));

        Membresia membresia = new Membresia("plan basico", 28, new BigDecimal(50000), 2, TipoMembresia.MUSCULACION);
        MembresiaDTO guardada = membresiaService.registrarMembresia(new MembresiaCreateDTO(membresia.getDuracionDias(), membresia.getPrecioSugerido(), membresia.getNombre(), membresia.getAsistenciasPorSemana(), membresia.getTipoMembresia()));

        MedioPago medioPago = new MedioPago("TRANSFERENCIA");
        MedioPagoDTO medioPagoGuardado = medioPagoService.registrarMedioPago(new MedioPagoDTO(medioPago.getNombre()));

        Puesto puesto = new Puesto("Instructor");
        PuestoDTO puestoGuardado = puestoService.registrarPuesto(new PuestoDTO(puesto.getNombre()));

        Empleado empleado = new Empleado("37895175", "Felipe", "1156687896", "felipruski@gmail.com", LocalDate.of(2001,8,4));
        EmpleadoDTO empleadoGuardado = empleadoService.registrarEmpleado(new EmpleadoDTO(empleado.getDni(), empleado.getNombre(), empleado.getTelefono(), empleado.getEmail(), empleado.getFechaNacimiento(), empleado.isActivo(), puestoGuardado.idPuesto()));

        pagoService.crearPago(new PagoCreateDTO(EstadoPago.PAGADO, socioGuardado.dni(), medioPagoGuardado.idMedioPago(), empleadoGuardado.dni(), List.of(new DetallePagoCreateDTO(1, BigDecimal.valueOf(35000), null, socioGuardado.dni(), guardada.idMembresia()))));

        MembresiaVigenteDTO membresiaVigente = socioService.membresiaVigenteSocio(socioGuardado.dni());

        assertEquals(LocalDate.now().plusDays(guardada.duracionDias()), membresiaVigente.vencimiento());
    }

    @Test
    @Transactional
    @Rollback
    public void verificarQueNuevaMembresiaArrancaDesdeVencimientoDeLaAnterior() {

        SocioDTO socio = socioService.registrarSocio(
                new SocioCreateDTO("30123456", "Juan", "1145678901", "juan@test.com", LocalDate.of(1990, 5, 10))
        );

        MembresiaDTO membresia = membresiaService.registrarMembresia(
                new MembresiaCreateDTO(
                        30,
                        new BigDecimal("50000"),
                        "Plan mensual",
                        3,
                        TipoMembresia.MUSCULACION
                )
        );

        MedioPagoDTO medioPago = medioPagoService.registrarMedioPago(
                new MedioPagoDTO("EFECTIVO")
        );

        PuestoDTO puesto = puestoService.registrarPuesto(
                new PuestoDTO("Instructor")
        );

        EmpleadoDTO empleado = empleadoService.registrarEmpleado(
                new EmpleadoDTO(
                        "28999888",
                        "Pedro",
                        "1166677788",
                        "pedro@test.com",
                        LocalDate.of(1995, 3, 20),
                        true,
                        puesto.idPuesto()
                )
        );


        pagoService.crearPago(new PagoCreateDTO(
                EstadoPago.PAGADO,
                socio.dni(),
                medioPago.idMedioPago(),
                empleado.dni(),
                List.of(
                        new DetallePagoCreateDTO(
                                1,
                                new BigDecimal("50000"),
                                null,
                                socio.dni(),
                                membresia.idMembresia()
                        )
                )
        ));


        pagoService.crearPago(new PagoCreateDTO(
                EstadoPago.PAGADO,
                socio.dni(),
                medioPago.idMedioPago(),
                empleado.dni(),
                List.of(
                        new DetallePagoCreateDTO(
                                1,
                                new BigDecimal("50000"),
                                null,
                                socio.dni(),
                                membresia.idMembresia()
                        )
                )
        ));


        List<SocioMembresia> membresias =
                socioMembresiaRepository.findBySocioDniOrderByFechaInicioAsc(socio.dni());

        assertEquals(2, membresias.size());

        SocioMembresia primera = membresias.get(0);
        SocioMembresia segunda = membresias.get(1);

        assertEquals(
                primera.getFechaHasta().plusDays(1),
                segunda.getFechaInicio()
        );
    }

    @Test
    @Transactional
    @Rollback
    public void verificarQuePagoNoPagadoNoAsignaMembresia() {

        SocioDTO socio = socioService.registrarSocio(
                new SocioCreateDTO("40111222", "Lucas", "1144445555", "lucas@test.com", LocalDate.of(1992, 4, 15))
        );

        MembresiaDTO membresia = membresiaService.registrarMembresia(
                new MembresiaCreateDTO(
                        30,
                        new BigDecimal("50000"),
                        "Plan mensual",
                        3,
                        TipoMembresia.MUSCULACION
                )
        );

        MedioPagoDTO medioPago = medioPagoService.registrarMedioPago(
                new MedioPagoDTO("EFECTIVO")
        );

        PuestoDTO puesto = puestoService.registrarPuesto(
                new PuestoDTO("Instructor")
        );

        EmpleadoDTO empleado = empleadoService.registrarEmpleado(
                new EmpleadoDTO(
                        "29999888",
                        "Martin",
                        "1166667777",
                        "martin@test.com",
                        LocalDate.of(1991, 6, 20),
                        true,
                        puesto.idPuesto()
                )
        );

        pagoService.crearPago(new PagoCreateDTO(
                EstadoPago.PENDIENTE,
                socio.dni(),
                medioPago.idMedioPago(),
                empleado.dni(),
                List.of(
                        new DetallePagoCreateDTO(
                                1,
                                new BigDecimal("50000"),
                                null,
                                socio.dni(),
                                membresia.idMembresia()
                        )
                )
        ));

        List<SocioMembresia> membresias = socioMembresiaRepository.findBySocioDniOrderByFechaInicioAsc(socio.dni());

        assertTrue(membresias.isEmpty());
    }

    @Test
    @Transactional
    @Rollback
    public void verificarQueSiMembresiaEstaVencidaLaNuevaArrancaHoy() {

        SocioDTO socio = socioService.registrarSocio(
                new SocioCreateDTO("41122333", "Ana", "1133334444", "ana@test.com", LocalDate.of(1988, 2, 10))
        );

        MembresiaDTO membresia = membresiaService.registrarMembresia(
                new MembresiaCreateDTO(
                        30,
                        new BigDecimal("50000"),
                        "Plan mensual",
                        3,
                        TipoMembresia.MUSCULACION
                )
        );

        MedioPagoDTO medioPago = medioPagoService.registrarMedioPago(
                new MedioPagoDTO("EFECTIVO")
        );

        PuestoDTO puesto = puestoService.registrarPuesto(
                new PuestoDTO("Instructor")
        );

        EmpleadoDTO empleado = empleadoService.registrarEmpleado(
                new EmpleadoDTO(
                        "27777111",
                        "Laura",
                        "1199998888",
                        "laura@test.com",
                        LocalDate.of(1990, 9, 5),
                        true,
                        puesto.idPuesto()
                )
        );

        // Primer pago
        pagoService.crearPago(new PagoCreateDTO(
                EstadoPago.PAGADO,
                socio.dni(),
                medioPago.idMedioPago(),
                empleado.dni(),
                List.of(
                        new DetallePagoCreateDTO(
                                1,
                                new BigDecimal("50000"),
                                null,
                                socio.dni(),
                                membresia.idMembresia()
                        )
                )
        ));

        // Forzar vencimiento en el pasado
        SocioMembresia primera =
                socioMembresiaRepository.findBySocioDniOrderByFechaInicioAsc(socio.dni()).get(0);

        primera.setFechaHasta(LocalDate.now().minusDays(1));
        socioMembresiaRepository.save(primera);

        // Segundo pago
        pagoService.crearPago(new PagoCreateDTO(
                EstadoPago.PAGADO,
                socio.dni(),
                medioPago.idMedioPago(),
                empleado.dni(),
                List.of(
                        new DetallePagoCreateDTO(
                                1,
                                new BigDecimal("50000"),
                                null,
                                socio.dni(),
                                membresia.idMembresia()
                        )
                )
        ));

        SocioMembresia nueva =
                socioMembresiaRepository.findBySocioDniOrderByFechaInicioAsc(socio.dni()).get(1);

        assertEquals(LocalDate.now(), nueva.getFechaInicio());
    }

    @Test
    @Transactional
    @Rollback
    public void verificarQueSiExisteMembresiaFuturaLaNuevaSeEncadenaALaUltima() {

        SocioDTO socio = socioService.registrarSocio(
                new SocioCreateDTO("43334444", "Carlos", "1122223333", "carlos@test.com", LocalDate.of(1985, 7, 18))
        );

        MembresiaDTO membresia = membresiaService.registrarMembresia(
                new MembresiaCreateDTO(
                        30,
                        new BigDecimal("50000"),
                        "Plan mensual",
                        3,
                        TipoMembresia.MUSCULACION
                )
        );

        MedioPagoDTO medioPago = medioPagoService.registrarMedioPago(
                new MedioPagoDTO("EFECTIVO")
        );

        PuestoDTO puesto = puestoService.registrarPuesto(
                new PuestoDTO("Instructor")
        );

        EmpleadoDTO empleado = empleadoService.registrarEmpleado(
                new EmpleadoDTO(
                        "26666111",
                        "Diego",
                        "1177776666",
                        "diego@test.com",
                        LocalDate.of(1987, 11, 22),
                        true,
                        puesto.idPuesto()
                )
        );

        // Pago 1
        pagoService.crearPago(new PagoCreateDTO(
                EstadoPago.PAGADO,
                socio.dni(),
                medioPago.idMedioPago(),
                empleado.dni(),
                List.of(
                        new DetallePagoCreateDTO(
                                1,
                                new BigDecimal("50000"),
                                null,
                                socio.dni(),
                                membresia.idMembresia()
                        )
                )
        ));

        // Pago 2 (futura)
        pagoService.crearPago(new PagoCreateDTO(
                EstadoPago.PAGADO,
                socio.dni(),
                medioPago.idMedioPago(),
                empleado.dni(),
                List.of(
                        new DetallePagoCreateDTO(
                                1,
                                new BigDecimal("50000"),
                                null,
                                socio.dni(),
                                membresia.idMembresia()
                        )
                )
        ));

        // Pago 3
        pagoService.crearPago(new PagoCreateDTO(
                EstadoPago.PAGADO,
                socio.dni(),
                medioPago.idMedioPago(),
                empleado.dni(),
                List.of(
                        new DetallePagoCreateDTO(
                                1,
                                new BigDecimal("50000"),
                                null,
                                socio.dni(),
                                membresia.idMembresia()
                        )
                )
        ));

        List<SocioMembresia> membresias =
                socioMembresiaRepository.findBySocioDniOrderByFechaInicioAsc(socio.dni());

        assertEquals(3, membresias.size());

        SocioMembresia segunda = membresias.get(1);
        SocioMembresia tercera = membresias.get(2);

        assertEquals(
                segunda.getFechaHasta().plusDays(1),
                tercera.getFechaInicio()
        );
    }






}
