package com.nexo.gestion.controller;


import com.nexo.gestion.dto.UsuarioLoginDTO;
import com.nexo.gestion.dto.UsuarioLoginResponseDTO;
import com.nexo.gestion.security.JwtService;
import com.nexo.gestion.security.TokenBlacklistService;
import com.nexo.gestion.services.AuthService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;
    private final JwtService jwtService;
    private final TokenBlacklistService tokenBlacklistService;
    private final boolean cookieSecure;

    public AuthController(AuthService authService, JwtService jwtService,
                          TokenBlacklistService tokenBlacklistService,
                          @Value("${app.cookie.secure:false}") boolean cookieSecure) {
        this.authService = authService;
        this.jwtService = jwtService;
        this.tokenBlacklistService = tokenBlacklistService;
        this.cookieSecure = cookieSecure;
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, String>> login(@RequestBody UsuarioLoginDTO usuarioLoginDTO, jakarta.servlet.http.HttpServletResponse response) {
        String token = authService.login(usuarioLoginDTO);
        
        // Crear Cookie HttpOnly
        jakarta.servlet.http.Cookie cookie = new jakarta.servlet.http.Cookie("jwt", token);
        cookie.setHttpOnly(true);
        cookie.setSecure(cookieSecure);
        cookie.setPath("/");
        cookie.setMaxAge(10 * 60 * 60); // 10 horas (alineado con JWT expiration)

        response.addCookie(cookie);

        // Extraer claims de forma segura via JwtService
        io.jsonwebtoken.Claims claims = jwtService.extraerClaims(token);

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
    public ResponseEntity<Map<String, String>> logout(jakarta.servlet.http.HttpServletRequest request,
                                                       jakarta.servlet.http.HttpServletResponse response) {
        // RC-4: Blacklist del token actual para revocación server-side
        if (request.getCookies() != null) {
            for (jakarta.servlet.http.Cookie c : request.getCookies()) {
                if ("jwt".equals(c.getName()) && c.getValue() != null && !c.getValue().isBlank()) {
                    try {
                        io.jsonwebtoken.Claims claims = jwtService.extraerClaims(c.getValue());
                        tokenBlacklistService.blacklist(c.getValue(), claims.getExpiration().getTime());
                    } catch (Exception ignored) {
                        // Token inválido o expirado — no hace falta blacklistear
                    }
                }
            }
        }

        jakarta.servlet.http.Cookie cookie = new jakarta.servlet.http.Cookie("jwt", "");
        cookie.setHttpOnly(true);
        cookie.setSecure(cookieSecure);
        cookie.setPath("/");
        cookie.setMaxAge(0);

        response.addCookie(cookie);
        return ResponseEntity.ok(Map.of("mensaje", "Logout exitoso"));
    }
}
