package com.nexo.gestion;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.nexo.gestion.controller.SocioController;
import com.nexo.gestion.dto.*;
import com.nexo.gestion.exceptions.GlobalExceptionHandler;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import com.nexo.gestion.exceptions.ObjetoDuplicadoException;
import com.nexo.gestion.exceptions.ObjetoNoEncontradoException;
import com.nexo.gestion.services.SocioService;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
public class SocioControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private SocioService socioService;

    // ==================== SEGURIDAD ====================

    @Test
    public void altaSocio_sinAuth_retorna401() throws Exception {
        mockMvc.perform(post("/socios")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}")
                        .with(csrf()))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(roles = "EMPLEADO")
    public void altaSocio_conRolEmpleado_retorna403() throws Exception {
        SocioCreateDTO dto = new SocioCreateDTO("44048664", "Mateo", "11566862", "mateo@test.com", LocalDate.of(2002, 1, 28));
        mockMvc.perform(post("/socios")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto))
                        .with(csrf()))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    public void altaSocio_conRolAdmin_retorna201() throws Exception {
        SocioCreateDTO dto = new SocioCreateDTO("44048664", "Mateo", "11566862", "mateo@test.com", LocalDate.of(2002, 1, 28));
        SocioDTO respuesta = new SocioDTO("44048664", "Mateo", "11566862", "mateo@test.com", LocalDate.of(2002, 1, 28), true, null);
        when(socioService.registrarSocio(any())).thenReturn(respuesta);

        mockMvc.perform(post("/socios")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto))
                        .with(csrf()))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.dni").value("44048664"))
                .andExpect(jsonPath("$.nombre").value("Mateo"));
    }

    // ==================== VALIDACIÓN DE INPUTS ====================

    @Test
    @WithMockUser(roles = "ADMIN")
    public void altaSocio_dniVacio_retorna400() throws Exception {
        SocioCreateDTO dto = new SocioCreateDTO("", "Mateo", "11566862", "mateo@test.com", LocalDate.of(2002, 1, 28));
        mockMvc.perform(post("/socios")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto))
                        .with(csrf()))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    public void altaSocio_dniConLetras_retorna400() throws Exception {
        SocioCreateDTO dto = new SocioCreateDTO("ABC12345", "Mateo", "11566862", "mateo@test.com", LocalDate.of(2002, 1, 28));
        mockMvc.perform(post("/socios")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto))
                        .with(csrf()))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    public void altaSocio_dniMuyCorto_retorna400() throws Exception {
        SocioCreateDTO dto = new SocioCreateDTO("123", "Mateo", "11566862", "mateo@test.com", LocalDate.of(2002, 1, 28));
        mockMvc.perform(post("/socios")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto))
                        .with(csrf()))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    public void altaSocio_emailInvalido_retorna400() throws Exception {
        SocioCreateDTO dto = new SocioCreateDTO("44048664", "Mateo", "11566862", "no-es-email", LocalDate.of(2002, 1, 28));
        mockMvc.perform(post("/socios")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto))
                        .with(csrf()))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    public void altaSocio_nombreVacio_retorna400() throws Exception {
        SocioCreateDTO dto = new SocioCreateDTO("44048664", "", "11566862", "mateo@test.com", LocalDate.of(2002, 1, 28));
        mockMvc.perform(post("/socios")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto))
                        .with(csrf()))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    public void altaSocio_nombreConNumeros_retorna400() throws Exception {
        SocioCreateDTO dto = new SocioCreateDTO("44048664", "Mateo123", "11566862", "mateo@test.com", LocalDate.of(2002, 1, 28));
        mockMvc.perform(post("/socios")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto))
                        .with(csrf()))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    public void altaSocio_telefonoConLetras_retorna400() throws Exception {
        SocioCreateDTO dto = new SocioCreateDTO("44048664", "Mateo", "abc12345", "mateo@test.com", LocalDate.of(2002, 1, 28));
        mockMvc.perform(post("/socios")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto))
                        .with(csrf()))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    public void altaSocio_sinFechaNacimiento_retorna400() throws Exception {
        String json = """
            {
                "dni": "44048664",
                "nombre": "Mateo",
                "telefono": "11566862",
                "email": "mateo@test.com"
            }
            """;
        mockMvc.perform(post("/socios")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json)
                        .with(csrf()))
                .andExpect(status().isBadRequest());
    }

    // ==================== EXCEPTION HANDLER ====================

    @Test
    @WithMockUser(roles = "ADMIN")
    public void altaSocio_duplicado_retorna409() throws Exception {
        SocioCreateDTO dto = new SocioCreateDTO("44048664", "Mateo", "11566862", "mateo@test.com", LocalDate.of(2002, 1, 28));
        when(socioService.registrarSocio(any()))
                .thenThrow(new ObjetoDuplicadoException("El dni 44048664 ya existe"));

        mockMvc.perform(post("/socios")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto))
                        .with(csrf()))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").exists());
    }

    @Test
    @WithMockUser(roles = {"ADMIN", "EMPLEADO"})
    public void buscarPorDni_noExiste_retorna404() throws Exception {
        when(socioService.buscarSocioPorDni("99999999"))
                .thenThrow(new ObjetoNoEncontradoException("socio"));

        mockMvc.perform(get("/socios/99999999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").exists());
    }

    // ==================== ENDPOINTS GET ====================

    @Test
    @WithMockUser(roles = "ADMIN")
    public void mostrarSocios_retornaPaginado() throws Exception {
        PageResponseDTO<SocioDTO> pagina = new PageResponseDTO<>(List.of(), 0, 20, 0, 0);
        when(socioService.buscarSociosPaginados(anyInt(), anyInt(), any(), any())).thenReturn(pagina);

        mockMvc.perform(get("/socios")
                        .param("page", "0")
                        .param("size", "20"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    public void buscarSocios_porQuery_retornaLista() throws Exception {
        when(socioService.buscarSocios(anyString())).thenReturn(List.of());

        mockMvc.perform(get("/socios/search")
                        .param("q", "mateo"))
                .andExpect(status().isOk());
    }
}
