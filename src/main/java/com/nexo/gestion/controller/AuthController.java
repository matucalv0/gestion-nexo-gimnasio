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
    public ResponseEntity<Map<String, String>> login(@RequestBody UsuarioLoginDTO usuarioLoginDTO, jakarta.servlet.http.HttpServletResponse response) {
        String token = authService.login(usuarioLoginDTO);
        
        // Crear Cookie HttpOnly
        jakarta.servlet.http.Cookie cookie = new jakarta.servlet.http.Cookie("jwt", token);
        cookie.setHttpOnly(true);
        cookie.setSecure(false); // Cambiar a true en Producción con HTTPS
        cookie.setPath("/");
        cookie.setMaxAge(7 * 24 * 60 * 60); // 7 días
        
        response.addCookie(cookie);

        // Decodificar claims para enviar info del usuario sin exponer el token
        io.jsonwebtoken.Claims claims = io.jsonwebtoken.Jwts.parserBuilder()
                .setSigningKey(io.jsonwebtoken.security.Keys.hmacShaKeyFor(
                        authService.getJwtSecret().getBytes(java.nio.charset.StandardCharsets.UTF_8)))
                .build()
                .parseClaimsJws(token)
                .getBody();

        Map<String, String> body = new java.util.HashMap<>();
        body.put("mensaje", "Login exitoso");
        body.put("username", claims.getSubject());
        body.put("rol", claims.get("roles") != null ? claims.get("roles").toString() : "");
        if (claims.get("dni") != null) {
            body.put("dniEmpleado", claims.get("dni").toString());
        }
        return ResponseEntity.ok(body);
    }

    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logout(jakarta.servlet.http.HttpServletResponse response) {
        jakarta.servlet.http.Cookie cookie = new jakarta.servlet.http.Cookie("jwt", "");
        cookie.setHttpOnly(true);
        cookie.setSecure(false); // Cambiar a true en Producción con HTTPS
        cookie.setPath("/");
        cookie.setMaxAge(0);

        response.addCookie(cookie);
        return ResponseEntity.ok(Map.of("mensaje", "Logout exitoso"));
    }
}
