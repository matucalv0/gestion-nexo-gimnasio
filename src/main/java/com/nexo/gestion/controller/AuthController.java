package com.nexo.gestion.controller;


import com.nexo.gestion.dto.UsuarioLoginDTO;
import com.nexo.gestion.dto.UsuarioLoginResponseDTO;
import com.nexo.gestion.services.AuthService;
import org.apache.catalina.Authenticator;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/auth")
public class AuthController {
    private final AuthService authService;


    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, String>> login(@RequestBody UsuarioLoginDTO usuarioLoginDTO) {
        String token = authService.login(usuarioLoginDTO);
        return ResponseEntity.ok(Map.of("token", token));






    }

}
