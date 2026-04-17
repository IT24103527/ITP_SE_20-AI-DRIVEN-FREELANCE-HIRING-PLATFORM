package com.example.talentflowbackend.service;

import com.example.talentflowbackend.entity.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;

@Service
public class JwtService {

    @Value("${spring.security.jwt.secret}")
    private String secretKey;

    @Value("${spring.security.jwt.expiration}")
    private long jwtExpiration;

    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSignInKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    private Key getSignInKey() {
        byte[] keyBytes = Decoders.BASE64.decode(secretKey);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    public String generateToken(User user) {
        Map<String, Object> extraClaims = new HashMap<>();
        // Use first role if available, otherwise empty string
        String primaryRole = (user.getRoles() != null && !user.getRoles().isEmpty())
                ? user.getRoles().iterator().next().name() : "";
        extraClaims.put("role", primaryRole);
        extraClaims.put("roles", user.getRoles() != null
                ? user.getRoles().stream().map(r -> r.name()).toList() : List.of());
        extraClaims.put("userId", user.getId());
        extraClaims.put("fullName", user.getFullName());
        extraClaims.put("jti", UUID.randomUUID().toString());

        return Jwts.builder()
                .setClaims(extraClaims)
                .setSubject(user.getEmail())
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + jwtExpiration))
                .signWith(getSignInKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    public String generateToken(User user, com.example.talentflowbackend.entity.Role activeRole) {
        Map<String, Object> extraClaims = new HashMap<>();
        extraClaims.put("role", activeRole.name());
        extraClaims.put("roles", user.getRoles() != null
                ? user.getRoles().stream().map(r -> r.name()).toList() : List.of());
        extraClaims.put("userId", user.getId());
        extraClaims.put("fullName", user.getFullName());
        extraClaims.put("jti", UUID.randomUUID().toString());

        return Jwts.builder()
                .setClaims(extraClaims)
                .setSubject(user.getEmail())
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + jwtExpiration))
                .signWith(getSignInKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    public boolean isTokenValid(String token, UserDetails userDetails) {
        try {
            final String username = extractUsername(token);
            final Date expiration = extractExpiration(token);
            return username.equals(userDetails.getUsername()) && expiration.after(new Date());
        } catch (Exception e) {
            return false;
        }
    }
}
