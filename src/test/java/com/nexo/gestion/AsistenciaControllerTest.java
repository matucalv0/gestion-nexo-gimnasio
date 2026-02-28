package com.nexo.gestion;

import com.nexo.gestion.controller.AsistenciaController;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import com.nexo.gestion.dto.*;
import com.nexo.gestion.exceptions.GlobalExceptionHandler;
import com.nexo.gestion.services.AsistenciaService;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
public class AsistenciaControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AsistenciaService asistenciaService;

    // ==================== SEGURIDAD ====================

    @Test
    public void listarAsistencias_sinAuth_retorna401() throws Exception {
        mockMvc.perform(get("/asistencias"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    public void listarAsistencias_conAuth_retorna200() throws Exception {
        PageResponseDTO<AsistenciaDTO> pagina = new PageResponseDTO<>(List.of(), 0, 20, 0, 0);
        when(asistenciaService.buscarAsistenciasPaginadas(anyInt(), anyInt(), any(), any(), any()))
                .thenReturn(pagina);

        mockMvc.perform(get("/asistencias")
                        .param("page", "0")
                        .param("size", "20"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "EMPLEADO")
    public void estadisticasSemana_conEmpleado_retorna200() throws Exception {
        when(asistenciaService.asistenciasTotalesSemana(anyString())).thenReturn(3);

        mockMvc.perform(get("/asistencias/estadisticas/semana-actual")
                        .param("q", "44048664"))
                .andExpect(status().isOk())
                .andExpect(content().string("3"));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    public void estadisticasMensuales_retorna200() throws Exception {
        when(asistenciaService.estadisticasMensualesAsistencias())
                .thenReturn(new EstadisticasAsistenciasMensualDTO(0, new java.math.BigDecimal("0"), 0, List.of(), 0));

        mockMvc.perform(get("/asistencias/estadisticas/mes"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    public void distribucionHoraria_retorna200() throws Exception {
        when(asistenciaService.obtenerDistribucionPorHora()).thenReturn(List.of());

        mockMvc.perform(get("/asistencias/estadisticas/distribucion-horaria"))
                .andExpect(status().isOk());
    }
}
