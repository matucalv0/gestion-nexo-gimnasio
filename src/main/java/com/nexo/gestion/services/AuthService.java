package com.nexo.gestion.services;

import com.nexo.gestion.dto.UsuarioLoginDTO;
import com.nexo.gestion.security.JwtService;
import org.springframework.security.authentication.AuthenticationManager;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;

import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.stereotype.Service;

@Service
public class AuthService {
    private static final Logger log = LoggerFactory.getLogger(AuthService.class);
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;

    public AuthService(AuthenticationManager authenticationManager, JwtService jwtService,
                       UserDetailsService userDetailsService) {
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.userDetailsService = userDetailsService;
    }

    public String login(UsuarioLoginDTO usuarioLoginDTO) {
        log.debug("AuthService: Intentando autenticar a {}", usuarioLoginDTO.username());
          authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        usuarioLoginDTO.username(),
                        usuarioLoginDTO.password()
                )
        );

          log.debug("AuthService: Autenticación exitosa para {}", usuarioLoginDTO.username());
          UserDetails user = userDetailsService.loadUserByUsername(usuarioLoginDTO.username());
          return jwtService.generarToken(user);
    }
}
