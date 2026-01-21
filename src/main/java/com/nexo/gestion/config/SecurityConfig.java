package com.nexo.gestion.config;

import com.nexo.gestion.security.JwtAuthFilter;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http, JwtAuthFilter jwtAuthFilter) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .formLogin(form -> form.disable())
                .httpBasic(basic -> basic.disable())
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint((request, response, authException) -> {
                            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                            response.getWriter().write("Credenciales inválidas");
                        })
                )
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(
                                "/login.html",
                                "/home.html",
                                "/socios.html",
                                "/asistencias.html",
                                "/pagos.html",
                                "/membresias.html",
                                "/editar-producto.html",
                                "/editar-membresia.html",
                                "/editar-socio.html",
                                "/productos.html",
                                "/registrar-producto.html",
                                "/registrar-membresia.html",
                                "/socio-detalle.html",
                                "/registrar-socio.html",
                                "/registrar-pago.html",
                                "/asistencia.html",
                                "/auth/login",
                                "/swagger-ui/**",
                                "/v3/api-docs/**",
                                "/css/**",
                                "/js/**",
                                "/assets/**",
                                "/favicon.ico"
                        ).permitAll()
                        .anyRequest().authenticated()
                )

                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
}

