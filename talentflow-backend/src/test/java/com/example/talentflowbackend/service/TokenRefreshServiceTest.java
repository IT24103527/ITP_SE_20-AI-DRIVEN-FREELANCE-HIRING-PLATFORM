package com.example.talentflowbackend.service;

import com.example.talentflowbackend.dto.AuthResponse;
import com.example.talentflowbackend.dto.TokenPair;
import com.example.talentflowbackend.entity.RefreshToken;
import com.example.talentflowbackend.entity.Role;
import com.example.talentflowbackend.entity.User;
import com.example.talentflowbackend.repository.RefreshTokenRepository;
import com.example.talentflowbackend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.util.Date;
import java.util.HashSet;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for TokenRefreshService.
 * Covers Properties 14, 15, 16 from the design spec.
 */
class TokenRefreshServiceTest {

    private RefreshTokenRepository refreshTokenRepository;
    private UserRepository userRepository;
    private JwtService jwtService;
    private TokenRefreshService service;

    private User testUser;

    @BeforeEach
    void setUp() {
        refreshTokenRepository = mock(RefreshTokenRepository.class);
        userRepository = mock(UserRepository.class);
        jwtService = mock(JwtService.class);
        service = new TokenRefreshService(refreshTokenRepository, userRepository, jwtService);

        testUser = User.builder()
                .id("user-123")
                .email("test@example.com")
                .fullName("Test User")
                .roles(new HashSet<>(Set.of(Role.CLIENT)))
                .isActive(true)
                .build();
    }

    // ── Property 14: Refresh Token Stored as SHA-256 Hash ────────

    @Test
    @DisplayName("Property 14: issueTokenPair stores SHA-256 hash, not raw token")
    void issueTokenPair_storesHashNotRawToken() {
        when(jwtService.generateToken(any(User.class), any(Role.class))).thenReturn("access-token");
        ArgumentCaptor<RefreshToken> captor = ArgumentCaptor.forClass(RefreshToken.class);
        when(refreshTokenRepository.save(captor.capture())).thenAnswer(inv -> inv.getArgument(0));

        TokenPair pair = service.issueTokenPair(testUser, Role.CLIENT);

        assertNotNull(pair.refreshToken(), "Raw refresh token must not be null");
        assertNotNull(pair.accessToken(), "Access token must not be null");

        RefreshToken stored = captor.getValue();
        assertNotEquals(pair.refreshToken(), stored.getTokenHash(),
                "Stored tokenHash must not equal raw refresh token");
        assertFalse(stored.isRevoked(), "Newly issued token must not be revoked");
        assertNotNull(stored.getExpiresAt());
        assertTrue(stored.getExpiresAt().after(new Date()), "Token must expire in the future");
    }

    // ── Property 15: Refresh Token Rotation ──────────────────────

    @Test
    @DisplayName("Property 15: refreshAccessToken revokes old token and issues new pair")
    void refreshAccessToken_rotatesToken() {
        String rawToken = "raw-refresh-token-abc";
        String tokenHash = sha256(rawToken);

        RefreshToken existing = RefreshToken.builder()
                .id("rt-1")
                .tokenHash(tokenHash)
                .userId("user-123")
                .role("CLIENT")
                .expiresAt(new Date(System.currentTimeMillis() + 7 * 24 * 60 * 60 * 1000L))
                .revoked(false)
                .build();

        when(refreshTokenRepository.findByTokenHash(tokenHash)).thenReturn(Optional.of(existing));
        when(userRepository.findById("user-123")).thenReturn(Optional.of(testUser));
        when(jwtService.generateToken(any(User.class), any(Role.class))).thenReturn("new-access-token");
        when(refreshTokenRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        AuthResponse response = service.refreshAccessToken(rawToken);

        assertNotNull(response.getToken(), "New access token must be present");
        assertNotNull(response.getRefreshToken(), "New refresh token must be present");
        assertNotEquals(rawToken, response.getRefreshToken(), "New refresh token must differ from old");
        assertTrue(existing.isRevoked(), "Old refresh token must be revoked after rotation");
    }

    // ── Property 16: Invalid Refresh Token Returns No Token ──────

    @Test
    @DisplayName("Property 16: unknown refresh token returns error with no token")
    void refreshAccessToken_unknownTokenReturnsError() {
        when(refreshTokenRepository.findByTokenHash(any())).thenReturn(Optional.empty());

        AuthResponse response = service.refreshAccessToken("completely-unknown-token");

        assertNull(response.getToken(), "No access token must be issued for unknown refresh token");
        assertNull(response.getRefreshToken(), "No refresh token must be issued for unknown refresh token");
        assertNotNull(response.getMessage());
    }

    @Test
    @DisplayName("Property 16: revoked refresh token returns error with no token")
    void refreshAccessToken_revokedTokenReturnsError() {
        String rawToken = "revoked-token";
        String tokenHash = sha256(rawToken);

        RefreshToken revoked = RefreshToken.builder()
                .tokenHash(tokenHash)
                .userId("user-123")
                .role("CLIENT")
                .expiresAt(new Date(System.currentTimeMillis() + 86400000L))
                .revoked(true)
                .build();

        when(refreshTokenRepository.findByTokenHash(tokenHash)).thenReturn(Optional.of(revoked));

        AuthResponse response = service.refreshAccessToken(rawToken);

        assertNull(response.getToken());
        assertNull(response.getRefreshToken());
    }

    @Test
    @DisplayName("Property 16: expired refresh token returns error and deletes record")
    void refreshAccessToken_expiredTokenReturnsError() {
        String rawToken = "expired-token";
        String tokenHash = sha256(rawToken);

        RefreshToken expired = RefreshToken.builder()
                .tokenHash(tokenHash)
                .userId("user-123")
                .role("CLIENT")
                .expiresAt(new Date(System.currentTimeMillis() - 1000)) // already expired
                .revoked(false)
                .build();

        when(refreshTokenRepository.findByTokenHash(tokenHash)).thenReturn(Optional.of(expired));

        AuthResponse response = service.refreshAccessToken(rawToken);

        assertNull(response.getToken());
        verify(refreshTokenRepository).delete(expired);
    }

    // ── Helper ────────────────────────────────────────────────────

    private String sha256(String input) {
        try {
            java.security.MessageDigest digest = java.security.MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            return java.util.HexFormat.of().formatHex(hash);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}
