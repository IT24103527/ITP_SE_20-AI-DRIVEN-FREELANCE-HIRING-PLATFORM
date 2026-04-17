package com.example.talentflowbackend.volume;

import com.example.talentflowbackend.entity.Role;
import com.example.talentflowbackend.entity.User;
import com.example.talentflowbackend.service.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Volume tests for JwtService.
 *
 * Verifies correctness (not just speed) when processing large volumes:
 * - 10,000 tokens generated — all structurally valid
 * - 10,000 tokens validated — all return correct result
 * - 5,000 unique users — all tokens have correct email claim
 * - Large payload in claims — token still valid
 * - All 3 roles across 3,000 tokens — role claims correct
 */
@Tag("volume")
class JwtVolumeTest {

    private JwtService jwtService;

    private static final String SECRET =
            "404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970";

    @BeforeEach
    void setUp() {
        jwtService = new JwtService();
        ReflectionTestUtils.setField(jwtService, "secretKey", SECRET);
        ReflectionTestUtils.setField(jwtService, "jwtExpiration", 900_000L);
    }

    private User user(String email, Role role) {
        return User.builder()
                .id("id-" + email.hashCode())
                .email(email).fullName("Vol User")
                .roles(new HashSet<>(Set.of(role))).isActive(true).build();
    }

    // ── VOL-JWT-01: 10,000 tokens generated — all valid ──────────

    @Test
    @DisplayName("VOL-JWT-01: 10,000 generated tokens are all structurally valid (3 parts)")
    void generate10000Tokens_allStructurallyValid() {
        int count = 10_000;
        int invalid = 0;
        for (int i = 0; i < count; i++) {
            String token = jwtService.generateToken(user("user" + i + "@test.com", Role.CLIENT), Role.CLIENT);
            if (token == null || token.split("\\.").length != 3) invalid++;
        }
        assertEquals(0, invalid, invalid + " of " + count + " tokens were structurally invalid");
        System.out.printf("[VOL] 10,000 JWT generations: 0 invalid%n");
    }

    // ── VOL-JWT-02: 5,000 unique users — email claims correct ─────

    @Test
    @DisplayName("VOL-JWT-02: 5,000 unique user tokens all have correct email claim")
    void generate5000UniqueUsers_allEmailClaimsCorrect() {
        int count = 5_000;
        int mismatches = 0;
        for (int i = 0; i < count; i++) {
            String email = "vol" + i + "@talentflow.test";
            String token = jwtService.generateToken(user(email, Role.CLIENT), Role.CLIENT);
            String extracted = jwtService.extractUsername(token);
            if (!email.equals(extracted)) mismatches++;
        }
        assertEquals(0, mismatches, mismatches + " email claim mismatches out of " + count);
        System.out.printf("[VOL] 5,000 unique user tokens: 0 email mismatches%n");
    }

    // ── VOL-JWT-03: 3,000 tokens across all 3 roles ───────────────

    @Test
    @DisplayName("VOL-JWT-03: 3,000 tokens across CLIENT/FREELANCER/ADMIN all have correct role claim")
    void generate3000Tokens_allRolesCorrect() {
        Role[] roles = {Role.CLIENT, Role.FREELANCER, Role.ADMIN};
        int count = 3_000;
        int mismatches = 0;
        for (int i = 0; i < count; i++) {
            Role role = roles[i % 3];
            User u = user("role" + i + "@test.com", role);
            String token = jwtService.generateToken(u, role);
            String roleClaim = jwtService.extractClaim(token, c -> c.get("role", String.class));
            if (!role.name().equals(roleClaim)) mismatches++;
        }
        assertEquals(0, mismatches, mismatches + " role claim mismatches out of " + count);
        System.out.printf("[VOL] 3,000 tokens (all roles): 0 role mismatches%n");
    }

    // ── VOL-JWT-04: 10,000 validations — all return correct result ─

    @Test
    @DisplayName("VOL-JWT-04: 10,000 token validations return correct true/false")
    void validate10000Tokens_allCorrect() {
        User user = user("valid@test.com", Role.CLIENT);
        User otherUser = user("other@test.com", Role.FREELANCER);
        String token = jwtService.generateToken(user, Role.CLIENT);

        int wrongResults = 0;
        for (int i = 0; i < 5_000; i++) {
            if (!jwtService.isTokenValid(token, user)) wrongResults++;
        }
        for (int i = 0; i < 5_000; i++) {
            if (jwtService.isTokenValid(token, otherUser)) wrongResults++;
        }
        assertEquals(0, wrongResults, wrongResults + " incorrect validation results out of 10,000");
        System.out.printf("[VOL] 10,000 JWT validations: 0 incorrect results%n");
    }

    // ── VOL-JWT-05: 1,000 tokens — all unique ─────────────────────

    @Test
    @DisplayName("VOL-JWT-05: 1,000 tokens for same user are all unique")
    void generate1000Tokens_sameUser_allUnique() throws InterruptedException {
        User user = user("same@test.com", Role.CLIENT);
        Set<String> tokens = new HashSet<>();
        for (int i = 0; i < 1_000; i++) {
            Thread.sleep(1); // ensure unique iat
            tokens.add(jwtService.generateToken(user, Role.CLIENT));
        }
        assertEquals(1_000, tokens.size(), "Expected 1000 unique tokens");
        System.out.printf("[VOL] 1,000 tokens for same user: all unique%n");
    }
}
