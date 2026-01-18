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

}
