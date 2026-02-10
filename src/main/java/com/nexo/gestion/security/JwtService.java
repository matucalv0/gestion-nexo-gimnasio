package com.nexo.gestion.security;
import com.nexo.gestion.entity.Usuario;
import com.nexo.gestion.repository.UsuarioRepository;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;

@Service
public class JwtService {

    private final String secret;
    private final long expiration;
    private final UsuarioRepository usuarioRepository;

    public JwtService(@Value("${jwt.secret}") String secret,
                      @Value("${jwt.expiration}") long expiration,
                      UsuarioRepository usuarioRepository) {
        this.secret = secret;
        this.expiration = expiration;
        this.usuarioRepository = usuarioRepository;
    }

    private Key getKey() {
        return Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    public String generarToken(UserDetails userDetails) {
        // Buscar el DNI del empleado desde la base de datos
        String dni = null;
        String username = userDetails.getUsername();
        
        Usuario usuario = usuarioRepository.findByUsername(username).orElse(null);
        if (usuario != null && usuario.getEmpleado() != null) {
            dni = usuario.getEmpleado().getDni();
        }
        
        var builder = Jwts.builder()
                .setSubject(username)
                .claim("roles", userDetails.getAuthorities())
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + expiration))
                .signWith(getKey(), SignatureAlgorithm.HS256);
        
        // Agregar DNI si existe
        if (dni != null) {
            builder.claim("dni", dni);
        }
        
        return builder.compact();
    }

    public String extraerUsername(String token) {
        return getClaims(token).getSubject();
    }

    public Claims extraerClaims(String token) {
        return getClaims(token);
    }

    public boolean esTokenValido(String token, UserDetails userDetails) {
        String username = extraerUsername(token);
        return username.equals(userDetails.getUsername()) && !tokenExpirado(token);
    }

    private boolean tokenExpirado(String token) {
        return getClaims(token)
                .getExpiration()
                .before(new Date());
    }

    private Claims getClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }
}
