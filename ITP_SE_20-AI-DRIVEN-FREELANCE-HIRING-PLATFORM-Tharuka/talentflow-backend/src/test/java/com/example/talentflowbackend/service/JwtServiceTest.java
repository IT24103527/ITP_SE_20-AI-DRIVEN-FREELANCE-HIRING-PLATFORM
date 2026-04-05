package com.example.talentflowbackend.service;

import com.example.talentflowbackend.entity.Role;
import com.example.talentflowbackend.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.HashSet;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for JwtService.
 * Covers token generation (single-role and multi-role), claim extraction, and validation.
 */
class JwtServiceTest {

    private JwtService jwtService;

    private static final String TEST_SECRET =
            "404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970";
    private static final long EXPIRATION = 86400000L;

    @BeforeEach
    void setUp() {
        jwtService = new JwtService();
        ReflectionTestUtils.setField(jwtService, "secretKey", TEST_SECRET);
        ReflectionTestUtils.setField(jwtService, "jwtExpiration", EXPIRATION);
    }

    // ── Helpers ───────────────────────────────────────────────────

    private User buildUser(String email, Role... roles) {
        Set<Role> roleSet = new HashSet<>(Set.of(roles));
        return User.builder()
                .id("test-id-001")
                .email(email)
                .fullName("Test User")
                .clientPassword("encoded")
                .roles(roleSet)
                .isActive(true)
                .build();
    }

    // ── generateToken(User, Role) ─────────────────────────────────

    @Test
    @DisplayName("generateToken(user, role) returns a non-null 3-part JWT")
    void generateToken_withRole_returnsValidJwt() {
        User user = buildUser("client@test.com", Role.CLIENT);
        String token = jwtService.generateToken(user, Role.CLIENT);
        assertNotNull(token);
        assertEquals(3, token.split("\\.").length, "JWT must have 3 parts");
    }

    @Test
    @DisplayName("generateToken(user, role) embeds the correct active role claim")
    void generateToken_withRole_embedsCorrectRoleClaim() {
        User user = buildUser("client@test.com", Role.CLIENT);
        String token = jwtService.generateToken(user, Role.CLIENT);
        String roleClaim = jwtService.extractClaim(token, c -> c.get("role", String.class));
        assertEquals("CLIENT", roleClaim);
    }

    @Test
    @DisplayName("generateToken(user, role) embeds FREELANCER role when logging in as freelancer")
    void generateToken_withFreelancerRole_embedsFreelancerClaim() {
        User user = buildUser("multi@test.com", Role.CLIENT, Role.FREELANCER);
        String token = jwtService.generateToken(user, Role.FREELANCER);
        String roleClaim = jwtService.extractClaim(token, c -> c.get("role", String.class));
        assertEquals("FREELANCER", roleClaim);
    }

    @Test
    @DisplayName("generateToken(user, role) embeds userId and fullName claims")
    void generateToken_withRole_embedsUserMetaClaims() {
        User user = buildUser("admin@test.com", Role.ADMIN);
        String token = jwtService.generateToken(user, Role.ADMIN);
        String userId   = jwtService.extractClaim(token, c -> c.get("userId",   String.class));
        String fullName = jwtService.extractClaim(token, c -> c.get("fullName", String.class));
        assertEquals("test-id-001", userId);
        assertEquals("Test User",   fullName);
    }

    @Test
    @DisplayName("generateToken(user) fallback — returns valid JWT even with empty roles set")
    void generateToken_noRole_emptyRolesSet_doesNotThrow() {
        User user = User.builder()
                .id("empty-roles")
                .email("noroles@test.com")
                .fullName("No Roles")
                .roles(new HashSet<>())
                .isActive(true)
                .build();
        assertDoesNotThrow(() -> jwtService.generateToken(user));
    }

    @Test
    @DisplayName("generateToken(user) fallback — returns valid JWT with null roles")
    void generateToken_noRole_nullRoles_doesNotThrow() {
        User user = User.builder()
                .id("null-roles")
                .email("nullroles@test.com")
                .fullName("Null Roles")
                .roles(null)
                .isActive(true)
                .build();
        assertDoesNotThrow(() -> jwtService.generateToken(user));
    }

    // ── extractUsername ───────────────────────────────────────────

    @Test
    @DisplayName("extractUsername() returns the correct email from token")
    void extractUsername_returnsCorrectEmail() {
        User user = buildUser("extract@test.com", Role.CLIENT);
        String token = jwtService.generateToken(user, Role.CLIENT);
        assertEquals("extract@test.com", jwtService.extractUsername(token));
    }

    // ── isTokenValid ──────────────────────────────────────────────

    @Test
    @DisplayName("isTokenValid() returns true for a fresh valid token")
    void isTokenValid_freshToken_returnsTrue() {
        User user = buildUser("valid@test.com", Role.CLIENT);
        String token = jwtService.generateToken(user, Role.CLIENT);
        assertTrue(jwtService.isTokenValid(token, user));
    }

    @Test
    @DisplayName("isTokenValid() returns false for a token belonging to a different user")
    void isTokenValid_wrongUser_returnsFalse() {
        User user1 = buildUser("user1@test.com", Role.CLIENT);
        User user2 = buildUser("user2@test.com", Role.FREELANCER);
        String token = jwtService.generateToken(user1, Role.CLIENT);
        assertFalse(jwtService.isTokenValid(token, user2));
    }

    @Test
    @DisplayName("isTokenValid() returns false for a tampered token")
    void isTokenValid_tamperedToken_returnsFalse() {
        User user = buildUser("tamper@test.com", Role.CLIENT);
        String token = jwtService.generateToken(user, Role.CLIENT);
        String tampered = token.substring(0, token.length() - 4) + "XXXX";
        assertFalse(jwtService.isTokenValid(tampered, user));
    }

    @Test
    @DisplayName("isTokenValid() returns false for an expired token")
    void isTokenValid_expiredToken_returnsFalse() {
        ReflectionTestUtils.setField(jwtService, "jwtExpiration", -1L);
        User user = buildUser("expired@test.com", Role.CLIENT);
        String token = jwtService.generateToken(user, Role.CLIENT);
        assertFalse(jwtService.isTokenValid(token, user));
    }

    @Test
    @DisplayName("isTokenValid() returns false for a completely invalid string")
    void isTokenValid_garbageToken_returnsFalse() {
        User user = buildUser("garbage@test.com", Role.CLIENT);
        assertFalse(jwtService.isTokenValid("not.a.jwt", user));
    }
}
