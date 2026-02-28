package com.nexo.gestion;

import com.nexo.gestion.dto.*;
import com.nexo.gestion.entity.*;
import com.nexo.gestion.exceptions.CantidadCeroDetalle;
import com.nexo.gestion.exceptions.ObjetoNoEncontradoException;
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
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Tests para validaciones de borde en PagoService que los tests existentes no cubren:
 * - Cantidad cero en detalle
 * - Detalle sin producto ni membresía
 * - Estado inválido (ni PAGADO ni PENDIENTE)
 * - Descuento inexistente / inactivo
 */
@SpringBootTest
public class PagoValidationTest {

    @Autowired private PagoService pagoService;
    @Autowired private SocioService socioService;
    @Autowired private MedioPagoService medioPagoService;
    @Autowired private EmpleadoService empleadoService;
    @Autowired private PuestoService puestoService;
    @Autowired private MembresiaService membresiaService;
    @Autowired private ProductoService productoService;

    private record TestEntities(SocioDTO socio, MedioPagoDTO medioPago, EmpleadoDTO empleado, MembresiaDTO membresia) {}

    private TestEntities crearEntidadesBase() {
        SocioDTO socio = socioService.registrarSocio(
                new SocioCreateDTO("PV" + UUID.randomUUID().toString().substring(0, 6).replaceAll("[^0-9]", "1") + "1",
                        "Test", "11223344", "pv_" + System.nanoTime() + "@test.com", LocalDate.of(1990, 1, 1)));

        MedioPagoDTO mp = medioPagoService.registrarMedioPago(
                new MedioPagoDTO("MP_" + UUID.randomUUID().toString().substring(0, 8)));

        PuestoDTO puesto = puestoService.registrarPuesto(new PuestoDTO("PV_Puesto_" + System.nanoTime()));
        EmpleadoDTO empleado = empleadoService.registrarEmpleado(
                new EmpleadoDTO("EV" + UUID.randomUUID().toString().substring(0, 6).replaceAll("[^0-9]", "2") + "2",
                        "TestEmp", "22334455", "ev_" + System.nanoTime() + "@test.com", LocalDate.now(), true, puesto.idPuesto()));

        MembresiaDTO membresia = membresiaService.registrarMembresia(
                new MembresiaCreateDTO(30, new BigDecimal("50000"), "Plan PV_" + System.nanoTime(), 3, TipoMembresia.MUSCULACION));

        return new TestEntities(socio, mp, empleado, membresia);
    }

    @Test
    @Transactional
    @Rollback
    public void crearPago_conCantidadCero_lanzaExcepcion() {
        var e = crearEntidadesBase();

        assertThrows(CantidadCeroDetalle.class, () ->
                pagoService.crearPago(new PagoCreateDTO(
                        EstadoPago.PAGADO, e.socio.dni(), e.medioPago.idMedioPago(), e.empleado.dni(),
                        List.of(new DetallePagoCreateDTO(0, new BigDecimal("50000"), null, e.socio.dni(), e.membresia.idMembresia()))
                ))
        );
    }

    @Test
    @Transactional
    @Rollback
    public void crearPago_conCantidadNegativa_lanzaExcepcion() {
        var e = crearEntidadesBase();

        assertThrows(CantidadCeroDetalle.class, () ->
                pagoService.crearPago(new PagoCreateDTO(
                        EstadoPago.PAGADO, e.socio.dni(), e.medioPago.idMedioPago(), e.empleado.dni(),
                        List.of(new DetallePagoCreateDTO(-1, new BigDecimal("50000"), null, e.socio.dni(), e.membresia.idMembresia()))
                ))
        );
    }

    @Test
    @Transactional
    @Rollback
    public void crearPago_detallesSinProductoNiMembresia_lanzaExcepcion() {
        var e = crearEntidadesBase();

        assertThrows(IllegalStateException.class, () ->
                pagoService.crearPago(new PagoCreateDTO(
                        EstadoPago.PAGADO, e.socio.dni(), e.medioPago.idMedioPago(), e.empleado.dni(),
                        List.of(new DetallePagoCreateDTO(1, new BigDecimal("50000"), null, e.socio.dni(), null))
                ))
        );
    }

    @Test
    @Transactional
    @Rollback
    public void crearPago_productoInexistente_lanzaExcepcion() {
        var e = crearEntidadesBase();

        assertThrows(ObjetoNoEncontradoException.class, () ->
                pagoService.crearPago(new PagoCreateDTO(
                        EstadoPago.PAGADO, e.socio.dni(), e.medioPago.idMedioPago(), e.empleado.dni(),
                        List.of(new DetallePagoCreateDTO(1, new BigDecimal("5000"), 99999, null, null))
                ))
        );
    }

    @Test
    @Transactional
    @Rollback
    public void crearPago_conMembresiaYSinSocio_lanzaExcepcion() {
        var e = crearEntidadesBase();

        assertThrows(ObjetoNoEncontradoException.class, () ->
                pagoService.crearPago(new PagoCreateDTO(
                        EstadoPago.PAGADO, null, e.medioPago.idMedioPago(), e.empleado.dni(),
                        List.of(new DetallePagoCreateDTO(1, new BigDecimal("50000"), null, null, e.membresia.idMembresia()))
                ))
        );
    }

    @Test
    @Transactional
    @Rollback
    public void crearPago_descuentoInexistente_lanzaExcepcion() {
        var e = crearEntidadesBase();

        PagoCreateDTO dto = new PagoCreateDTO(
                EstadoPago.PAGADO, e.socio.dni(), e.medioPago.idMedioPago(), e.empleado.dni(),
                List.of(new DetallePagoCreateDTO(1, new BigDecimal("50000"), null, e.socio.dni(), e.membresia.idMembresia()))
        );
        dto.setIdDescuento(99999);

        assertThrows(ObjetoNoEncontradoException.class, () ->
                pagoService.crearPago(dto)
        );
    }

    @Test
    @Transactional
    @Rollback
    public void crearPago_conProductoYDescontarStock() {
        var e = crearEntidadesBase();

        ProductoCreateDTO productoDTO = new ProductoCreateDTO();
        productoDTO.setNombre("Proteina PV_" + System.nanoTime());
        productoDTO.setPrecioSugerido(new BigDecimal("25000"));
        productoDTO.setStock(10);
        ProductoDTO producto = productoService.registrarProducto(productoDTO);

        PagoDTO pago = pagoService.crearPago(new PagoCreateDTO(
                EstadoPago.PAGADO, e.socio.dni(), e.medioPago.idMedioPago(), e.empleado.dni(),
                List.of(new DetallePagoCreateDTO(2, new BigDecimal("25000"), producto.idProducto(), null, null))
        ));

        assertNotNull(pago.idPago());
        // El stock debería haberse reducido a 8
        ProductoDTO productoActualizado = productoService.buscarProductoPorId(producto.idProducto());
        assertEquals(8, productoActualizado.stock());
    }

    @Test
    @Transactional
    @Rollback
    public void crearPago_montoFinalSeCalculaConPrecioSugerido() {
        var e = crearEntidadesBase();

        PagoDTO pago = pagoService.crearPago(new PagoCreateDTO(
                EstadoPago.PAGADO, e.socio.dni(), e.medioPago.idMedioPago(), e.empleado.dni(),
                List.of(new DetallePagoCreateDTO(1, new BigDecimal("35000"), null, e.socio.dni(), e.membresia.idMembresia()))
        ));

        // El monto final debe basarse en el precio sugerido de la membresía ($50000), no en el enviado ($35000)
        assertEquals(0, pago.monto().compareTo(new BigDecimal("50000")),
                "El monto final debe ser el precio sugerido de la membresía, no el precio enviado en el detalle");
    }
}
