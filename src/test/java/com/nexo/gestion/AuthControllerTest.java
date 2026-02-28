package com.nexo.gestion;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.nexo.gestion.controller.AuthController;
import com.nexo.gestion.dto.UsuarioLoginDTO;
import com.nexo.gestion.exceptions.GlobalExceptionHandler;
import com.nexo.gestion.security.JwtService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import com.nexo.gestion.security.TokenBlacklistService;
import com.nexo.gestion.services.AuthService;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.impl.DefaultClaims;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
public class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private AuthService authService;

    @MockBean
    private JwtService jwtService;

    @MockBean
    private TokenBlacklistService tokenBlacklistService;

    // ==================== LOGIN EXITOSO ====================

    @Test
    public void login_conCredencialesValidas_retorna200ConToken() throws Exception {
        String fakeToken = "fake.jwt.token";
        when(authService.login(any(UsuarioLoginDTO.class))).thenReturn(fakeToken);

        Claims claims = new DefaultClaims(Map.of(
                "sub", "admin",
                "roles", "[ROLE_ADMIN]"
        ));
        when(jwtService.extraerClaims(fakeToken)).thenReturn(claims);

        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new UsuarioLoginDTO("admin", "password123")))
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.mensaje").value("Login exitoso"))
                .andExpect(jsonPath("$.username").value("admin"));
    }

    // ==================== LOGIN FALLIDO ====================

    @Test
    public void login_conCredencialesInvalidas_retorna401() throws Exception {
        when(authService.login(any(UsuarioLoginDTO.class)))
                .thenThrow(new BadCredentialsException("Bad credentials"));

        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new UsuarioLoginDTO("admin", "wrongpassword")))
                        .with(csrf()))
                .andExpect(status().isUnauthorized());
    }

    @Test
    public void login_usernameVacio_retorna400() throws Exception {
        String json = """
            {"username": "", "password": "password123"}
            """;
        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json)
                        .with(csrf()))
                .andExpect(status().isBadRequest());
    }

    @Test
    public void login_passwordVacio_retorna400() throws Exception {
        String json = """
            {"username": "admin", "password": ""}
            """;
        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json)
                        .with(csrf()))
                .andExpect(status().isBadRequest());
    }

    @Test
    public void login_sinBody_retorna400() throws Exception {
        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .with(csrf()))
                .andExpect(status().isBadRequest());
    }

    // ==================== LOGOUT ====================

    @Test
    public void logout_retorna200() throws Exception {
        mockMvc.perform(post("/auth/logout")
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.mensaje").value("Logout exitoso"));
    }
}
