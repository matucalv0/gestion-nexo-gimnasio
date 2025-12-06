package com.nexo.gestion;

import com.nexo.gestion.entity.*;
import com.nexo.gestion.repository.*;
import org.checkerframework.checker.units.qual.A;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.annotation.Rollback;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertNotNull;

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

        assertNotNull(guardado.getId_pago());
    }

    @Test
    @Transactional
    @Rollback
    public void verificarDetallesEnPago(){
        Puesto puesto = new Puesto("Profesor");
        puestoRepository.save(puesto);
        Socio socio = new Socio("44048664", "Mateo", "1156686238", "matucalv@gmail.com", LocalDate.of(2002,1,28));
        socioRepository.save(socio);
        MedioPago medioPago = new MedioPago("Mercado Pete");
        medioPagoRepository.save(medioPago);
        Empleado empleado = new Empleado("37895175", "Felipe", "1156687896", "felipruski@gmail.com", LocalDate.of(2001,8,4), puesto);
        empleadoRepository.save(empleado);

        Membresia membresia = new Membresia("Estandar", 30, BigDecimal.valueOf(30000));
        membresiaRepository.save(membresia);

        Producto agua = new Producto("Agua", BigDecimal.valueOf(500), 10);
        productoRepository.save(agua);


        Pago pago = new Pago(EstadoPago.PAGADO, membresia.getPrecio_sugerido(), socio, medioPago, empleado); //doy de alta el pago
        pagoRepository.save(pago);



        SocioMembresia suscripcion = new SocioMembresia(socio, membresia);
        socio.agregarMembresia(suscripcion);
        membresia.agregarSocio(suscripcion);
        socioRepository.save(socio);
        membresiaRepository.save(membresia);

        socioMembresiaRepository.save(suscripcion);

        DetallePago detalle1 = new DetallePago(1, suscripcion, pago, suscripcion.getPrecio());
        pago.agregarDetalle(detalle1);
        DetallePago guardado = detallePagoRepository.save(detalle1);
        DetallePago detalle2 = new DetallePago(2, agua, pago, 2, agua.getPrecio_sugerido());
        pago.agregarDetalle(detalle2);
        DetallePago guardado2 = detallePagoRepository.save(detalle2);
        pagoRepository.save(pago);

        BigDecimal sumaSubtotales = BigDecimal.ZERO;
        for (DetallePago detalle: pago.getDetalles()){
            sumaSubtotales = sumaSubtotales.add(detalle.getSubtotal());   //calculo de subtotales, esto iria en services

        }
        pago.setMonto(sumaSubtotales);
        pagoRepository.save(pago);


        System.out.println(pago.toStringConDetalles());

        assertNotNull(guardado.getId_detallepago());
        assertNotNull(guardado2.getId_detallepago());


    }

}
