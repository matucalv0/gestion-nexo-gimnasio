package com.nexo.gestion;

import com.nexo.gestion.dto.*;
import com.nexo.gestion.entity.*;
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
public class FinanzaTest {
    @Autowired
    private FinanzaService finanzaService;
    @Autowired
    private PagoRepository pagoRepository;
    @Autowired
    private GastoRepository gastoRepository;
    @Autowired
    private SocioRepository socioRepository;
    @Autowired
    private MedioPagoRepository medioPagoRepository;
    @Autowired
    private EmpleadoRepository empleadoRepository;
    @Autowired
    private PuestoRepository puestoRepository;

    @Test
    @Transactional
    @Rollback
    public void buscarMovimientos_devuelveOrdenadoPorFecha() {
        // Setup
        Puesto puesto = puestoRepository.save(new Puesto("Caja"));
        Empleado empleado = empleadoRepository.save(new Empleado("11112222", "Test", "111", "test@test.com", LocalDate.now(), puesto));
        Socio socio = socioRepository.save(new Socio("33334444", "Cliente", "222", "cliente@test.com", LocalDate.of(1990, 1, 1)));
        MedioPago medioPago = medioPagoRepository.save(new MedioPago("EFECTIVO"));

        Pago pago = new Pago(EstadoPago.PAGADO, new BigDecimal("10000"), socio, medioPago, empleado);
        pagoRepository.save(pago);

        Gasto gasto = new Gasto(new BigDecimal("5000"), CategoriaGasto.SERVICIOS, "Edesur", medioPago);
        gastoRepository.save(gasto);

        List<MovimientoFinancieroDTO> movimientos = finanzaService.buscarMovimientos();

        assertFalse(movimientos.isEmpty());
        for (int i = 0; i < movimientos.size() - 1; i++) {
            assertTrue(
                movimientos.get(i).fecha().compareTo(movimientos.get(i + 1).fecha()) >= 0,
                "Movimientos no están ordenados por fecha descendente"
            );
        }
    }

    @Test
    @Transactional
    @Rollback
    public void obtenerGananciaMensual_calculaIngresosMenosEgresos() {
        Puesto puesto = puestoRepository.save(new Puesto("Admin"));
        Empleado empleado = empleadoRepository.save(new Empleado("55556666", "Admin", "333", "admin@test.com", LocalDate.now(), puesto));
        Socio socio = socioRepository.save(new Socio("77778888", "Socio", "444", "socio@test.com", LocalDate.of(1985, 5, 15)));
        MedioPago medioPago = medioPagoRepository.save(new MedioPago("TARJETA"));

        Pago pago = new Pago(EstadoPago.PAGADO, new BigDecimal("50000"), socio, medioPago, empleado);
        pagoRepository.save(pago);

        Gasto gasto = new Gasto(new BigDecimal("20000"), CategoriaGasto.SUELDOS, "Limpieza", medioPago);
        gastoRepository.save(gasto);

        BigDecimal ganancia = finanzaService.obtenerGananciaMensual();

        assertEquals(new BigDecimal("30000"), ganancia);
    }

    @Test
    @Transactional
    @Rollback
    public void obtenerGananciaMensual_devuelveCeroSiNoHayDatos() {
        BigDecimal ganancia = finanzaService.obtenerGananciaMensual();
        assertEquals(BigDecimal.ZERO, ganancia);
    }

    @Test
    @Transactional
    @Rollback
    public void obtenerGananciaDeHoy_calculaCorrectamente() {
        Puesto puesto = puestoRepository.save(new Puesto("Recepcion"));
        Empleado empleado = empleadoRepository.save(new Empleado("99990000", "Recep", "555", "recep@test.com", LocalDate.now(), puesto));
        Socio socio = socioRepository.save(new Socio("11110000", "Nuevo", "666", "nuevo@test.com", LocalDate.of(1995, 3, 20)));
        MedioPago medioPago = medioPagoRepository.save(new MedioPago("MERCADOPAGO"));

        Pago pago = new Pago(EstadoPago.PAGADO, new BigDecimal("35000"), socio, medioPago, empleado);
        pagoRepository.save(pago);

        Gasto gasto = new Gasto(new BigDecimal("10000"), CategoriaGasto.INSUMOS, "Proveedor", medioPago);
        gastoRepository.save(gasto);

        BigDecimal gananciaHoy = finanzaService.obtenerGananciaDeHoy();

        assertEquals(new BigDecimal("25000"), gananciaHoy);
    }
}
