package com.example.talentflowbackend.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * IP-based rate limiter.
 *
 * Auth endpoints (login, register, OTP): max 10 requests per minute per IP.
 * All other endpoints: max 100 requests per minute per IP.
 */
@Component
@Slf4j
public class RateLimitingFilter extends OncePerRequestFilter {

    /** Default true when constructed manually (unit tests); Spring overrides via @Value. */
    @Value("${app.rate-limit.enabled:true}")
    private boolean enabled = true;

    private static final int  AUTH_LIMIT    = 10;
    private static final int  GENERAL_LIMIT = 100;
    private static final long WINDOW_MS     = 60_000L;

    private final Map<String, AtomicInteger> counters = new ConcurrentHashMap<>();
    private volatile long lastCleanup = System.currentTimeMillis();

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain filterChain)
            throws ServletException, IOException {

        if (!enabled) {
            filterChain.doFilter(request, response);
            return;
        }

        String ip   = getClientIp(request);
        String path = request.getRequestURI();
        boolean isAuth = path.startsWith("/api/auth/") || path.startsWith("/api/otp/");

        int  limit     = isAuth ? AUTH_LIMIT : GENERAL_LIMIT;
        long windowKey = System.currentTimeMillis() / WINDOW_MS;
        String key     = ip + ":" + windowKey + ":" + (isAuth ? "a" : "g");

        int current = counters.computeIfAbsent(key, k -> new AtomicInteger(0))
                              .incrementAndGet();
        maybeCleanup();

        if (current > limit) {
            log.warn("Rate limit exceeded: ip={} path={} count={}", ip, path, current);
            response.setStatus(429);
            response.setContentType("application/json");
            response.setHeader("Retry-After", "60");
            response.setHeader("X-RateLimit-Limit",     String.valueOf(limit));
            response.setHeader("X-RateLimit-Remaining", "0");
            response.getWriter().write(
                "{\"message\":\"Too many requests. Please wait before trying again.\",\"retryAfterSeconds\":60}"
            );
            return;
        }

        response.setHeader("X-RateLimit-Limit",     String.valueOf(limit));
        response.setHeader("X-RateLimit-Remaining", String.valueOf(Math.max(0, limit - current)));
        filterChain.doFilter(request, response);
    }

    private String getClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) return forwarded.split(",")[0].trim();
        String realIp = request.getHeader("X-Real-IP");
        if (realIp != null && !realIp.isBlank()) return realIp.trim();
        return request.getRemoteAddr();
    }

    private void maybeCleanup() {
        long now = System.currentTimeMillis();
        if (now - lastCleanup > WINDOW_MS * 2) {
            lastCleanup = now;
            long cur = now / WINDOW_MS;
            counters.keySet().removeIf(k -> {
                try { return Long.parseLong(k.split(":")[1]) < cur - 1; }
                catch (Exception e) { return true; }
            });
        }
    }

    /** Clears in-memory counters (used by tests that explicitly enable rate limiting). */
    public void resetForTesting() {
        counters.clear();
        lastCleanup = System.currentTimeMillis();
    }
}
