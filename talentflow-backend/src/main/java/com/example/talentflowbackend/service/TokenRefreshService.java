package com.example.talentflowbackend.service;

import com.example.talentflowbackend.dto.AuthResponse;
import com.example.talentflowbackend.dto.TokenPair;
import com.example.talentflowbackend.entity.RefreshToken;
import com.example.talentflowbackend.entity.Role;
import com.example.talentflowbackend.entity.User;
import com.example.talentflowbackend.repository.RefreshTokenRepository;
import com.example.talentflowbackend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Date;
import java.util.HexFormat;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class TokenRefreshService {

    private static final long REFRESH_TOKEN_TTL_MS = 7L * 24 * 60 * 60 * 1000; // 7 days

    private final RefreshTokenRepository refreshTokenRepository;
    private final UserRepository userRepository;
    private final JwtService jwtService;

    /**
     * Issues a new access token + refresh token pair.
     * The raw refresh token is returned to the client; only its SHA-256 hash is stored.
     */
    public TokenPair issueTokenPair(User user, Role activeRole) {
        String accessToken = jwtService.generateToken(user, activeRole);
        String rawRefreshToken = UUID.randomUUID().toString();
        String tokenHash = sha256(rawRefreshToken);

        RefreshToken record = RefreshToken.builder()
                .tokenHash(tokenHash)
                .userId(user.getId())
                .role(activeRole.name())
                .expiresAt(new Date(System.currentTimeMillis() + REFRESH_TOKEN_TTL_MS))
                .createdAt(new Date())
                .revoked(false)
                .build();

        refreshTokenRepository.save(record);
        log.info("Refresh token issued for userId={} role={}", user.getId(), activeRole);
        return new TokenPair(accessToken, rawRefreshToken);
    }

    /**
     * Validates the refresh token, revokes it, and issues a new token pair (rotation).
     */
    public AuthResponse refreshAccessToken(String rawRefreshToken) {
        String tokenHash = sha256(rawRefreshToken);
        Optional<RefreshToken> opt = refreshTokenRepository.findByTokenHash(tokenHash);

        if (opt.isEmpty()) {
            return AuthResponse.builder().message("Invalid refresh token.").build();
        }

        RefreshToken record = opt.get();

        if (record.isRevoked()) {
            return AuthResponse.builder().message("Refresh token has been revoked.").build();
        }

        if (record.getExpiresAt().before(new Date())) {
            refreshTokenRepository.delete(record);
            return AuthResponse.builder().message("Refresh token expired. Please log in again.").build();
        }

        Optional<User> userOpt = userRepository.findById(record.getUserId());
        if (userOpt.isEmpty() || Boolean.FALSE.equals(userOpt.get().getIsActive())) {
            return AuthResponse.builder().message("User account not found or inactive.").build();
        }

        User user = userOpt.get();
        Role activeRole = Role.valueOf(record.getRole());

        // Revoke old token before issuing new pair (rotation)
        record.setRevoked(true);
        refreshTokenRepository.save(record);

        TokenPair newPair = issueTokenPair(user, activeRole);
        log.info("Refresh token rotated for userId={}", user.getId());

        return AuthResponse.builder()
                .token(newPair.accessToken())
                .refreshToken(newPair.refreshToken())
                .role(activeRole.name())
                .message("Token refreshed successfully.")
                .build();
    }

    /**
     * Explicitly revokes a refresh token (e.g., on logout).
     */
    public void revokeRefreshToken(String rawRefreshToken) {
        String tokenHash = sha256(rawRefreshToken);
        refreshTokenRepository.findByTokenHash(tokenHash).ifPresent(record -> {
            record.setRevoked(true);
            refreshTokenRepository.save(record);
            log.info("Refresh token revoked for userId={}", record.getUserId());
        });
    }

    private String sha256(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (Exception e) {
            throw new RuntimeException("SHA-256 hashing failed", e);
        }
    }
}
