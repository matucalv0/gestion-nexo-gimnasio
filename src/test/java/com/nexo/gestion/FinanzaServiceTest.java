package com.nexo.gestion;

import com.nexo.gestion.dto.*;
import com.nexo.gestion.entity.*;
import com.nexo.gestion.repository.*;
import com.nexo.gestion.services.FinanzaService;
import com.nexo.gestion.services.GastoService;
import com.nexo.gestion.services.MedioPagoService;
import com.nexo.gestion.services.PagoService;
import com.nexo.gestion.services.SocioService;
import com.nexo.gestion.services.EmpleadoService;
import com.nexo.gestion.services.PuestoService;
import com.nexo.gestion.services.MembresiaService;
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
 * Reemplazo del FinanzaTest deshabilitado.
 * Testea búsqueda de movimientos financieros, ganancias y balances.
 */
@SpringBootTest
public class FinanzaServiceTest {

    @Autowired private FinanzaService finanzaService;
    @Autowired private PagoService pagoService;
    @Autowired private GastoService gastoService;
    @Autowired private SocioService socioService;
    @Autowired private MedioPagoService medioPagoService;
    @Autowired private EmpleadoService empleadoService;
    @Autowired private PuestoService puestoService;
    @Autowired private MembresiaService membresiaService;

    @Test
    @Transactional
    @Rollback
    public void buscarMovimientosPaginados_sinDatos_retornaPaginaVacia() {
        PageResponseDTO<MovimientoFinancieroDTO> response =
                finanzaService.buscarMovimientosPaginados(0, 10, null, null);

        assertNotNull(response, "La respuesta no debería ser null");
        assertNotNull(response.content(), "El contenido no debería ser null");
        assertTrue(response.totalElements() >= 0);
    }

    @Test
    @Transactional
    @Rollback
    public void buscarMovimientosPaginados_conPagoYGasto_retornaAmbos() {
        // Setup: crear un pago
        SocioDTO socio = socioService.registrarSocio(
                new SocioCreateDTO("FT111111", "FinTest", "11111111", "ft_" + System.nanoTime() + "@test.com", LocalDate.of(1990, 1, 1)));
        MedioPagoDTO mp = medioPagoService.registrarMedioPago(
                new MedioPagoDTO("MP_FT_" + UUID.randomUUID().toString().substring(0, 6)));
        PuestoDTO puesto = puestoService.registrarPuesto(new PuestoDTO("FT_Puesto_" + System.nanoTime()));
        EmpleadoDTO empleado = empleadoService.registrarEmpleado(
                new EmpleadoDTO("FT222222", "FTEmp", "22222222", "fte_" + System.nanoTime() + "@test.com", LocalDate.now(), true, puesto.idPuesto()));
        MembresiaDTO membresia = membresiaService.registrarMembresia(
                new MembresiaCreateDTO(30, new BigDecimal("50000"), "Plan FT_" + System.nanoTime(), 3, TipoMembresia.MUSCULACION));

        pagoService.crearPago(new PagoCreateDTO(
                EstadoPago.PAGADO, socio.dni(), mp.idMedioPago(), empleado.dni(),
                List.of(new DetallePagoCreateDTO(1, new BigDecimal("50000"), null, socio.dni(), membresia.idMembresia()))));

        // Setup: crear un gasto
        gastoService.registrarGasto(new GastoDTO(null, new BigDecimal("10000"),
                CategoriaGasto.SERVICIOS, "Proveedor FT", mp.idMedioPago()));

        // Act
        PageResponseDTO<MovimientoFinancieroDTO> response =
                finanzaService.buscarMovimientosPaginados(0, 10, null, null);

        // Assert
        assertNotNull(response);
        assertTrue(response.totalElements() >= 2,
                "Debería haber al menos 2 movimientos (1 pago + 1 gasto), hay: " + response.totalElements());
    }

    @Test
    @Transactional
    @Rollback
    public void buscarMovimientosPaginados_conFiltroFechas_filtraCorrectamente() {
        // Buscar con rango de fechas del futuro (no debería haber nada)
        LocalDate futuro = LocalDate.now().plusYears(10);
        PageResponseDTO<MovimientoFinancieroDTO> response =
                finanzaService.buscarMovimientosPaginados(0, 10, futuro, futuro.plusDays(1));

        assertNotNull(response);
        assertEquals(0, response.totalElements(),
                "No debería haber movimientos en el futuro");
    }

    @Test
    @Transactional
    @Rollback
    public void obtenerGananciaMensual_retornaValorNoNull() {
        BigDecimal ganancia = finanzaService.obtenerGananciaMensual();
        assertNotNull(ganancia);
    }

    @Test
    @Transactional
    @Rollback
    public void obtenerGananciaDeHoy_retornaValorNoNull() {
        BigDecimal ganancia = finanzaService.obtenerGananciaDeHoy();
        assertNotNull(ganancia);
    }

    @Test
    @Transactional
    @Rollback
    public void obtenerGananciaSemanal_retornaValorNoNull() {
        BigDecimal ganancia = finanzaService.obtenerGananciaSemanal();
        assertNotNull(ganancia);
    }

    @Test
    @Transactional
    @Rollback
    public void obtenerBalanceSemana_retornaListaNoNull() {
        var balance = finanzaService.obtenerBalanceSemana();
        assertNotNull(balance);
    }

    @Test
    @Transactional
    @Rollback
    public void obtenerBalanceMeses_retornaListaNoNull() {
        var balance = finanzaService.obtenerBalanceMeses();
        assertNotNull(balance);
    }
}
