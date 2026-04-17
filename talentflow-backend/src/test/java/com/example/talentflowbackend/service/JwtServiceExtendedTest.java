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
 * Extended unit tests for JwtService covering edge cases.
 */
class JwtServiceExtendedTest {

    private JwtService jwtService;

    private static final String SECRET =
            "404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970";

    @BeforeEach
    void setUp() {
        jwtService = new JwtService();
        ReflectionTestUtils.setField(jwtService, "secretKey", SECRET);
        ReflectionTestUtils.setField(jwtService, "jwtExpiration", 900_000L);
    }

    private User user(String email, Role... roles) {
        return User.builder()
                .id("id-1").email(email).fullName("Test User")
                .roles(new HashSet<>(Set.of(roles))).isActive(true).build();
    }

    // ── Token structure ───────────────────────────────────────────

    @Test
    @DisplayName("Token has exactly 3 dot-separated parts")
    void token_hasThreeParts() {
        String token = jwtService.generateToken(user("a@b.com", Role.CLIENT), Role.CLIENT);
        assertEquals(3, token.split("\\.").length);
    }

    @Test
    @DisplayName("Two tokens for same user are different (unique iat)")
    void twoTokens_areDifferent() throws InterruptedException {
        User u = user("a@b.com", Role.CLIENT);
        String t1 = jwtService.generateToken(u, Role.CLIENT);
        Thread.sleep(10);
        String t2 = jwtService.generateToken(u, Role.CLIENT);
        assertNotEquals(t1, t2);
    }

    // ── Role claim ────────────────────────────────────────────────

    @Test
    @DisplayName("ADMIN role embedded correctly in token")
    void adminRole_embeddedCorrectly() {
        String token = jwtService.generateToken(user("admin@b.com", Role.ADMIN), Role.ADMIN);
        assertEquals("ADMIN", jwtService.extractClaim(token, c -> c.get("role", String.class)));
    }

    @Test
    @DisplayName("FREELANCER role embedded correctly in token")
    void freelancerRole_embeddedCorrectly() {
        String token = jwtService.generateToken(user("fl@b.com", Role.FREELANCER), Role.FREELANCER);
        assertEquals("FREELANCER", jwtService.extractClaim(token, c -> c.get("role", String.class)));
    }

    @Test
    @DisplayName("Multi-role user: active role in token matches requested role")
    void multiRole_activeRoleMatchesRequested() {
        User u = user("multi@b.com", Role.CLIENT, Role.FREELANCER);
        String token = jwtService.generateToken(u, Role.FREELANCER);
        assertEquals("FREELANCER", jwtService.extractClaim(token, c -> c.get("role", String.class)));
    }

    // ── Expiry ────────────────────────────────────────────────────

    @Test
    @DisplayName("Token expiry is approximately 15 minutes from now")
    void tokenExpiry_isApprox15Minutes() {
        String token = jwtService.generateToken(user("a@b.com", Role.CLIENT), Role.CLIENT);
        long expMs = jwtService.extractExpiration(token).getTime();
        long nowMs = System.currentTimeMillis();
        long diffSeconds = (expMs - nowMs) / 1000;
        assertTrue(diffSeconds > 850 && diffSeconds <= 900,
                "Expiry should be ~15 min, was " + diffSeconds + "s");
    }

    @Test
    @DisplayName("Expired token (expiration=-1) is invalid")
    void expiredToken_isInvalid() {
        ReflectionTestUtils.setField(jwtService, "jwtExpiration", -1L);
        User u = user("a@b.com", Role.CLIENT);
        String token = jwtService.generateToken(u, Role.CLIENT);
        assertFalse(jwtService.isTokenValid(token, u));
    }

    // ── Validation edge cases ─────────────────────────────────────

    @Test
    @DisplayName("Empty string token is invalid")
    void emptyToken_isInvalid() {
        assertFalse(jwtService.isTokenValid("", user("a@b.com", Role.CLIENT)));
    }

    @Test
    @DisplayName("Random string token is invalid")
    void randomString_isInvalid() {
        assertFalse(jwtService.isTokenValid("not.a.jwt", user("a@b.com", Role.CLIENT)));
    }

    @Test
    @DisplayName("Token signed with different secret is invalid")
    void differentSecret_isInvalid() {
        String token = jwtService.generateToken(user("a@b.com", Role.CLIENT), Role.CLIENT);
        // Change the secret
        ReflectionTestUtils.setField(jwtService, "secretKey",
                "5A7134743777217A25432A462D4A614E645267556B58703273357638792F423F");
        assertFalse(jwtService.isTokenValid(token, user("a@b.com", Role.CLIENT)));
    }

    // ── Claims ────────────────────────────────────────────────────

    @Test
    @DisplayName("userId claim matches user id")
    void userId_claimMatchesId() {
        User u = user("a@b.com", Role.CLIENT);
        String token = jwtService.generateToken(u, Role.CLIENT);
        assertEquals("id-1", jwtService.extractClaim(token, c -> c.get("userId", String.class)));
    }

    @Test
    @DisplayName("fullName claim matches user fullName")
    void fullName_claimMatchesFullName() {
        User u = user("a@b.com", Role.CLIENT);
        String token = jwtService.generateToken(u, Role.CLIENT);
        assertEquals("Test User", jwtService.extractClaim(token, c -> c.get("fullName", String.class)));
    }

    @Test
    @DisplayName("extractUsername returns correct email")
    void extractUsername_returnsEmail() {
        String token = jwtService.generateToken(user("test@example.com", Role.CLIENT), Role.CLIENT);
        assertEquals("test@example.com", jwtService.extractUsername(token));
    }
}
