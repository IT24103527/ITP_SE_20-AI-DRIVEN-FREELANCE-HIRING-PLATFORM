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

import java.util.Date;
import java.util.HashSet;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * Extended unit tests for TokenRefreshService.
 */
class TokenRefreshServiceExtendedTest {

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
                .id("uid-1").email("test@example.com").fullName("Test")
                .roles(new HashSet<>(Set.of(Role.CLIENT))).isActive(true).build();
    }

    // ── issueTokenPair ────────────────────────────────────────────

    @Test
    @DisplayName("issueTokenPair returns non-null access and refresh tokens")
    void issueTokenPair_returnsNonNullTokens() {
        when(jwtService.generateToken(any(), any())).thenReturn("access-token");
        when(refreshTokenRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        TokenPair pair = service.issueTokenPair(testUser, Role.CLIENT);

        assertNotNull(pair.accessToken());
        assertNotNull(pair.refreshToken());
        assertFalse(pair.refreshToken().isBlank());
    }

    @Test
    @DisplayName("issueTokenPair stores token with revoked=false")
    void issueTokenPair_storedAsNotRevoked() {
        when(jwtService.generateToken(any(), any())).thenReturn("access-token");
        var captor = org.mockito.ArgumentCaptor.forClass(RefreshToken.class);
        when(refreshTokenRepository.save(captor.capture())).thenAnswer(i -> i.getArgument(0));

        service.issueTokenPair(testUser, Role.CLIENT);

        assertFalse(captor.getValue().isRevoked());
    }

    @Test
    @DisplayName("issueTokenPair stores future expiry date")
    void issueTokenPair_futureExpiry() {
        when(jwtService.generateToken(any(), any())).thenReturn("access-token");
        var captor = org.mockito.ArgumentCaptor.forClass(RefreshToken.class);
        when(refreshTokenRepository.save(captor.capture())).thenAnswer(i -> i.getArgument(0));

        service.issueTokenPair(testUser, Role.CLIENT);

        assertTrue(captor.getValue().getExpiresAt().after(new Date()));
    }

    @Test
    @DisplayName("issueTokenPair stores correct userId")
    void issueTokenPair_storesCorrectUserId() {
        when(jwtService.generateToken(any(), any())).thenReturn("access-token");
        var captor = org.mockito.ArgumentCaptor.forClass(RefreshToken.class);
        when(refreshTokenRepository.save(captor.capture())).thenAnswer(i -> i.getArgument(0));

        service.issueTokenPair(testUser, Role.CLIENT);

        assertEquals("uid-1", captor.getValue().getUserId());
    }

    // ── refreshAccessToken — inactive user ────────────────────────

    @Test
    @DisplayName("Refresh with inactive user returns error")
    void refresh_inactiveUser_returnsError() {
        testUser.setIsActive(false);
        String raw = "some-token";
        String hash = sha256(raw);

        RefreshToken record = RefreshToken.builder()
                .tokenHash(hash).userId("uid-1").role("CLIENT")
                .expiresAt(new Date(System.currentTimeMillis() + 86400000L))
                .revoked(false).build();

        when(refreshTokenRepository.findByTokenHash(hash)).thenReturn(Optional.of(record));
        when(userRepository.findById("uid-1")).thenReturn(Optional.of(testUser));

        AuthResponse response = service.refreshAccessToken(raw);

        assertNull(response.getToken());
        assertNotNull(response.getMessage());
    }

    // ── revokeRefreshToken ────────────────────────────────────────

    @Test
    @DisplayName("revokeRefreshToken marks token as revoked")
    void revokeRefreshToken_marksRevoked() {
        String raw = "revoke-me";
        String hash = sha256(raw);

        RefreshToken record = RefreshToken.builder()
                .tokenHash(hash).userId("uid-1").role("CLIENT")
                .expiresAt(new Date(System.currentTimeMillis() + 86400000L))
                .revoked(false).build();

        when(refreshTokenRepository.findByTokenHash(hash)).thenReturn(Optional.of(record));
        when(refreshTokenRepository.save(any())).thenReturn(record);

        service.revokeRefreshToken(raw);

        assertTrue(record.isRevoked());
        verify(refreshTokenRepository).save(record);
    }

    @Test
    @DisplayName("revokeRefreshToken with unknown token does nothing")
    void revokeRefreshToken_unknownToken_doesNothing() {
        when(refreshTokenRepository.findByTokenHash(any())).thenReturn(Optional.empty());

        assertDoesNotThrow(() -> service.revokeRefreshToken("unknown-token"));
        verify(refreshTokenRepository, never()).save(any());
    }

    // ── Two consecutive refreshes ─────────────────────────────────

    @Test
    @DisplayName("After rotation, old token is revoked and new token is different")
    void rotation_oldTokenRevoked_newTokenDifferent() {
        String raw = "original-token";
        String hash = sha256(raw);

        RefreshToken record = RefreshToken.builder()
                .tokenHash(hash).userId("uid-1").role("CLIENT")
                .expiresAt(new Date(System.currentTimeMillis() + 86400000L))
                .revoked(false).build();

        when(refreshTokenRepository.findByTokenHash(hash)).thenReturn(Optional.of(record));
        when(userRepository.findById("uid-1")).thenReturn(Optional.of(testUser));
        when(jwtService.generateToken(any(), any())).thenReturn("new-access-token");
        when(refreshTokenRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        AuthResponse response = service.refreshAccessToken(raw);

        assertTrue(record.isRevoked(), "Old token must be revoked");
        assertNotNull(response.getToken());
        assertNotNull(response.getRefreshToken());
        assertNotEquals(raw, response.getRefreshToken(), "New refresh token must differ");
    }

    private String sha256(String input) {
        try {
            java.security.MessageDigest d = java.security.MessageDigest.getInstance("SHA-256");
            byte[] h = d.digest(input.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            return java.util.HexFormat.of().formatHex(h);
        } catch (Exception e) { throw new RuntimeException(e); }
    }
}
