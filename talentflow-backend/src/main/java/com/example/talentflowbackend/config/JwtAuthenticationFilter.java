package com.example.talentflowbackend.config;

import com.example.talentflowbackend.service.JwtService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

/**
 * JWT authentication filter with an in-memory UserDetails cache.
 * Avoids a MongoDB round-trip on every authenticated request.
 * Cache entries expire after 5 minutes (matching typical JWT lifetime).
 */
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;

    // Simple TTL cache: email → (UserDetails, loadedAtMs)
    private static final Map<String, CachedUser> USER_CACHE = new ConcurrentHashMap<>();
    private static final long CACHE_TTL_MS = TimeUnit.MINUTES.toMillis(5);

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getServletPath();
        return path.equals("/api/reviews") || path.startsWith("/api/reviews/");
    }

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain filterChain)
            throws ServletException, IOException {

        final String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        final String jwt = authHeader.substring(7);
        final String userEmail;
        try {
            userEmail = jwtService.extractUsername(jwt);
        } catch (Exception e) {
            filterChain.doFilter(request, response);
            return;
        }

        if (userEmail != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            UserDetails userDetails = loadFromCacheOrDb(userEmail);
            if (jwtService.isTokenValid(jwt, userDetails)) {
                UsernamePasswordAuthenticationToken authToken =
                        new UsernamePasswordAuthenticationToken(
                                userDetails, null, userDetails.getAuthorities());
                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authToken);
            }
        }

        filterChain.doFilter(request, response);
    }

    private UserDetails loadFromCacheOrDb(String email) {
        CachedUser cached = USER_CACHE.get(email);
        long now = System.currentTimeMillis();
        if (cached != null && (now - cached.loadedAt) < CACHE_TTL_MS) {
            return cached.userDetails;
        }
        UserDetails fresh = userDetailsService.loadUserByUsername(email);
        USER_CACHE.put(email, new CachedUser(fresh, now));
        // Evict stale entries periodically (simple cleanup on cache miss)
        if (USER_CACHE.size() > 500) {
            USER_CACHE.entrySet().removeIf(e -> (now - e.getValue().loadedAt) >= CACHE_TTL_MS);
        }
        return fresh;
    }

    private record CachedUser(UserDetails userDetails, long loadedAt) {}
}
