package com.nexo.gestion;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.nexo.gestion.controller.PagoController;
import com.nexo.gestion.dto.*;
import com.nexo.gestion.entity.EstadoPago;
import com.nexo.gestion.exceptions.GlobalExceptionHandler;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import com.nexo.gestion.exceptions.MasDeUnaMembresiaEnDetalleException;
import com.nexo.gestion.exceptions.ObjetoNoEncontradoException;
import com.nexo.gestion.services.PagoService;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
public class PagoControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private PagoService pagoService;

    // ==================== SEGURIDAD ====================

    @Test
    public void crearPago_sinAuth_retorna401() throws Exception {
        mockMvc.perform(post("/pagos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}")
                        .with(csrf()))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    public void crearPago_conAdmin_estadoNull_retorna400() throws Exception {
        String json = """
            {
                "estado": null,
                "dniSocio": "44048664",
                "idMedioPago": 1,
                "dniEmpleado": "37895175",
                "detalles": []
            }
            """;
        mockMvc.perform(post("/pagos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json)
                        .with(csrf()))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    public void crearPago_sinMedioPago_retorna400() throws Exception {
        String json = """
            {
                "estado": "PAGADO",
                "dniSocio": "44048664",
                "idMedioPago": null,
                "dniEmpleado": "37895175",
                "detalles": [{"cantidad": 1, "precioUnitario": 50000, "idMembresia": 1}]
            }
            """;
        mockMvc.perform(post("/pagos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json)
                        .with(csrf()))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    public void crearPago_sinDniEmpleado_retorna400() throws Exception {
        String json = """
            {
                "estado": "PAGADO",
                "dniSocio": "44048664",
                "idMedioPago": 1,
                "dniEmpleado": "",
                "detalles": [{"cantidad": 1, "precioUnitario": 50000, "idMembresia": 1}]
            }
            """;
        mockMvc.perform(post("/pagos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json)
                        .with(csrf()))
                .andExpect(status().isBadRequest());
    }

    // ==================== EXCEPTION HANDLER ====================

    @Test
    @WithMockUser(roles = "ADMIN")
    public void crearPago_socioNoExiste_retorna404() throws Exception {
        PagoCreateDTO dto = new PagoCreateDTO(
                EstadoPago.PAGADO, "99999999", 1, "37895175",
                List.of(new DetallePagoCreateDTO(1, new BigDecimal("50000"), null, "99999999", 1))
        );
        when(pagoService.crearPago(any()))
                .thenThrow(new ObjetoNoEncontradoException("socio"));

        mockMvc.perform(post("/pagos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto))
                        .with(csrf()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("No se encontró: socio"));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    public void crearPago_masDeUnaMembresiaEnDetalle_retorna409() throws Exception {
        PagoCreateDTO dto = new PagoCreateDTO(
                EstadoPago.PAGADO, "44048664", 1, "37895175",
                List.of(
                        new DetallePagoCreateDTO(1, new BigDecimal("50000"), null, "44048664", 1),
                        new DetallePagoCreateDTO(1, new BigDecimal("50000"), null, "44048664", 2)
                )
        );
        when(pagoService.crearPago(any()))
                .thenThrow(new MasDeUnaMembresiaEnDetalleException());

        mockMvc.perform(post("/pagos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto))
                        .with(csrf()))
                .andExpect(status().isConflict());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    public void crearPago_estadoInvalido_retorna409() throws Exception {
        PagoCreateDTO dto = new PagoCreateDTO(
                EstadoPago.PAGADO, "44048664", 1, "37895175",
                List.of(new DetallePagoCreateDTO(1, new BigDecimal("50000"), null, "44048664", 1))
        );
        when(pagoService.crearPago(any()))
                .thenThrow(new IllegalStateException("Estado no válido"));

        mockMvc.perform(post("/pagos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto))
                        .with(csrf()))
                .andExpect(status().isConflict());
    }

    // ==================== ROLES: ADMIN vs EMPLEADO ====================

    @Test
    @WithMockUser(roles = "EMPLEADO")
    public void anularPago_conEmpleado_retorna403() throws Exception {
        mockMvc.perform(patch("/pagos/1/anular")
                        .with(csrf()))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "EMPLEADO")
    public void eliminarPago_conEmpleado_retorna403() throws Exception {
        mockMvc.perform(delete("/pagos/1")
                        .with(csrf()))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "EMPLEADO")
    public void crearPago_conEmpleado_permitido() throws Exception {
        PagoCreateDTO dto = new PagoCreateDTO(
                EstadoPago.PAGADO, "44048664", 1, "37895175",
                List.of(new DetallePagoCreateDTO(1, new BigDecimal("50000"), null, "44048664", 1))
        );
        when(pagoService.crearPago(any())).thenReturn(
                new PagoDTO(1, EstadoPago.PAGADO, java.time.LocalDate.now(), new BigDecimal("50000"), List.of())
        );

        mockMvc.perform(post("/pagos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto))
                        .with(csrf()))
                .andExpect(status().isCreated());
    }

    // ==================== ENDPOINTS GET ====================

    @Test
    @WithMockUser(roles = "ADMIN")
    public void obtenerPago_noExiste_retorna404() throws Exception {
        when(pagoService.obtenerPago(99999))
                .thenThrow(new ObjetoNoEncontradoException("pago"));

        mockMvc.perform(get("/pagos/99999"))
                .andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser(roles = "EMPLEADO")
    public void estadisticasRecaudadoHoy_conEmpleado_retorna403() throws Exception {
        mockMvc.perform(get("/pagos/estadisticas/recaudado-hoy"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    public void estadisticasRecaudadoHoy_conAdmin_retorna200() throws Exception {
        when(pagoService.recaudadoHoy()).thenReturn(BigDecimal.ZERO);

        mockMvc.perform(get("/pagos/estadisticas/recaudado-hoy"))
                .andExpect(status().isOk());
    }
}
