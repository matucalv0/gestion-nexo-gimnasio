package com.nexo.gestion.security;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

/**
 * Rate limiter para /auth/login: 5 intentos por IP cada 5 minutos.
 * Devuelve 429 Too Many Requests si se excede.
 * Implementación pura con ConcurrentHashMap (sin dependencias externas).
 */
@Component
public class RateLimitFilter implements Filter {

    private static final int MAX_ATTEMPTS = 5;
    private static final long WINDOW_MS = 5 * 60 * 1000L; // 5 minutos

    private final ConcurrentHashMap<String, CopyOnWriteArrayList<Long>> attempts = new ConcurrentHashMap<>();

    public RateLimitFilter() {
        // Limpieza periódica cada 10 minutos para evitar memory leak
        Executors.newSingleThreadScheduledExecutor(r -> {
            Thread t = new Thread(r, "rate-limit-cleanup");
            t.setDaemon(true);
            return t;
        }).scheduleAtFixedRate(() -> {
            long now = System.currentTimeMillis();
            attempts.forEach((ip, timestamps) -> {
                timestamps.removeIf(ts -> now - ts > WINDOW_MS);
                if (timestamps.isEmpty()) {
                    attempts.remove(ip);
                }
            });
        }, 10, 10, TimeUnit.MINUTES);
    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {

        HttpServletRequest httpRequest = (HttpServletRequest) request;

        // Solo limitar POST /auth/login
        if ("POST".equalsIgnoreCase(httpRequest.getMethod())
                && "/auth/login".equals(httpRequest.getRequestURI())) {

            String clientIp = getClientIp(httpRequest);
            long now = System.currentTimeMillis();

            CopyOnWriteArrayList<Long> timestamps = attempts.computeIfAbsent(clientIp, k -> new CopyOnWriteArrayList<>());

            // Limpiar intentos fuera de la ventana
            timestamps.removeIf(ts -> now - ts > WINDOW_MS);

            if (timestamps.size() >= MAX_ATTEMPTS) {
                HttpServletResponse httpResponse = (HttpServletResponse) response;
                httpResponse.setStatus(429);
                httpResponse.setContentType("application/json");
                httpResponse.getWriter().write("{\"error\": \"Demasiados intentos. Intente nuevamente en unos minutos.\"}");
                return;
            }

            timestamps.add(now);
        }

        chain.doFilter(request, response);
    }

    private String getClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
