package com.nexo.gestion.services;

import com.nexo.gestion.dto.UsuarioLoginDTO;
import com.nexo.gestion.security.JwtService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;

import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.stereotype.Service;

@Service
public class AuthService {
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;
    private final String jwtSecret;

    public AuthService(AuthenticationManager authenticationManager, JwtService jwtService,
                       UserDetailsService userDetailsService, @Value("${jwt.secret}") String jwtSecret) {
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.userDetailsService = userDetailsService;
        this.jwtSecret = jwtSecret;
    }

    public String getJwtSecret() {
        return jwtSecret;
    }

    public String login(UsuarioLoginDTO usuarioLoginDTO) {
          authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        usuarioLoginDTO.username(),
                        usuarioLoginDTO.password()
                )
        );

          UserDetails user = userDetailsService.loadUserByUsername(usuarioLoginDTO.username());
          return jwtService.generarToken(user);
    }
}
