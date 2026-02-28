package com.nexo.gestion;

import com.nexo.gestion.dto.GastoDTO;
import com.nexo.gestion.entity.CategoriaGasto;
import com.nexo.gestion.exceptions.ObjetoNoEncontradoException;
import com.nexo.gestion.services.GastoService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.annotation.Rollback;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
public class GastoServiceTest {

    @Autowired
    private GastoService gastoService;

    @Autowired
    private com.nexo.gestion.services.MedioPagoService medioPagoService;

    @Test
    @Transactional
    @Rollback
    public void registrarGasto_conDatosValidos_guardaCorrectamente() {
        var medioPago = medioPagoService.registrarMedioPago(
                new com.nexo.gestion.dto.MedioPagoDTO("Efectivo Test Gasto"));

        GastoDTO dto = new GastoDTO(null, new BigDecimal("15000"),
                CategoriaGasto.SERVICIOS, "Proveedor Test", medioPago.idMedioPago());

        GastoDTO guardado = gastoService.registrarGasto(dto);

        assertNotNull(guardado.fecha());
        assertEquals(new BigDecimal("15000"), guardado.monto());
        assertEquals(CategoriaGasto.SERVICIOS, guardado.categoria());
        assertEquals("Proveedor Test", guardado.proveedor());
    }

    @Test
    @Transactional
    @Rollback
    public void registrarGasto_sinMedioPago_lanzaExcepcion() {
        GastoDTO dto = new GastoDTO(null, new BigDecimal("15000"),
                CategoriaGasto.SERVICIOS, "Proveedor", null);

        assertThrows(ObjetoNoEncontradoException.class, () ->
                gastoService.registrarGasto(dto));
    }

    @Test
    @Transactional
    @Rollback
    public void registrarGasto_conMedioPagoInexistente_lanzaExcepcion() {
        GastoDTO dto = new GastoDTO(null, new BigDecimal("15000"),
                CategoriaGasto.SERVICIOS, "Proveedor", 99999);

        assertThrows(ObjetoNoEncontradoException.class, () ->
                gastoService.registrarGasto(dto));
    }

    @Test
    @Transactional
    @Rollback
    public void eliminarGasto_inexistente_lanzaExcepcion() {
        assertThrows(ObjetoNoEncontradoException.class, () ->
                gastoService.eliminarGasto(99999));
    }

    @Test
    @Transactional
    @Rollback
    public void buscarGastos_retornaListaVaciaOConDatos() {
        var gastos = gastoService.buscarGastos();
        assertNotNull(gastos);
    }
}
