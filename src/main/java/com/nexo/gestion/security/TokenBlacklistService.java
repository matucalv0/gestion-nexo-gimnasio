package com.nexo.gestion.security;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Servicio de blacklist de tokens JWT para revocación en logout.
 * Los tokens se almacenan en memoria con su timestamp de expiración,
 * y se limpian automáticamente cuando expiran.
 */
@Service
public class TokenBlacklistService {

    // Map: token -> expiration timestamp (ms)
    private final Map<String, Long> blacklistedTokens = new ConcurrentHashMap<>();

    /**
     * Agrega un token a la blacklist hasta que expire naturalmente.
     * @param token el JWT token
     * @param expirationMs timestamp de expiración del token en milisegundos
     */
    public void blacklist(String token, long expirationMs) {
        blacklistedTokens.put(token, expirationMs);
    }

    /**
     * Verifica si un token está en la blacklist.
     */
    public boolean isBlacklisted(String token) {
        return blacklistedTokens.containsKey(token);
    }

    /**
     * Limpieza periódica de tokens expirados (cada 10 minutos).
     */
    @Scheduled(fixedRate = 600_000)
    public void limpiarTokensExpirados() {
        long now = System.currentTimeMillis();
        blacklistedTokens.entrySet().removeIf(entry -> entry.getValue() < now);
    }
}
