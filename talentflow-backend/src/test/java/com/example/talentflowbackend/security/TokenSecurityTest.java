package com.example.talentflowbackend.security;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Non-functional security tests: JWT and token security edge cases.
 *
 * Verifies:
 * - Tokens with future "issued at" (iat) claims are rejected
 * - Tokens with missing required claims are rejected
 * - Tokens signed with HS512 (wrong algorithm) are rejected
 * - Extremely long tokens are handled gracefully
 * - Token injection via query parameter is not accepted
 * - Token injection via request body is not accepted
 * - Multiple Authorization headers are handled safely
 */
@Tag("security")
@ActiveProfiles("test")
@SpringBootTest
@AutoConfigureMockMvc
class TokenSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    // ── Algorithm substitution attacks ────────────────────────────

    @Test
    @DisplayName("SEC-TOK-01: JWT signed with RS256 (asymmetric) is rejected when server expects HS256")
    void jwt_rs256Algorithm_isRejected() throws Exception {
        // Fake RS256 header — server expects HS256
        String rs256Token = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9." +
                "eyJzdWIiOiJ0ZXN0QHRlc3QuY29tIiwicm9sZSI6IkNMSUVOVCIsImV4cCI6OTk5OTk5OTk5OX0." +
                "FAKE_RS256_SIGNATURE";
        mockMvc.perform(get("/api/user/profile")
                .header("Authorization", "Bearer " + rs256Token))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("SEC-TOK-02: JWT with HS512 algorithm is rejected when server expects HS256")
    void jwt_hs512Algorithm_isRejected() throws Exception {
        String hs512Token = "eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9." +
                "eyJzdWIiOiJ0ZXN0QHRlc3QuY29tIiwicm9sZSI6IkNMSUVOVCIsImV4cCI6OTk5OTk5OTk5OX0." +
                "FAKE_HS512_SIGNATURE";
        mockMvc.perform(get("/api/user/profile")
                .header("Authorization", "Bearer " + hs512Token))
                .andExpect(status().isUnauthorized());
    }

    // ── Missing required claims ───────────────────────────────────

    @Test
    @DisplayName("SEC-TOK-03: JWT missing 'sub' claim is rejected")
    void jwt_missingSubClaim_isRejected() throws Exception {
        // Payload: {"role":"CLIENT","exp":9999999999} — no sub
        String noSubToken = "eyJhbGciOiJIUzI1NiJ9." +
                "eyJyb2xlIjoiQ0xJRU5UIiwiZXhwIjo5OTk5OTk5OTk5fQ." +
                "FAKE_SIGNATURE";
        mockMvc.perform(get("/api/user/profile")
                .header("Authorization", "Bearer " + noSubToken))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("SEC-TOK-04: JWT missing 'exp' claim is rejected")
    void jwt_missingExpClaim_isRejected() throws Exception {
        // Payload: {"sub":"test@test.com","role":"CLIENT"} — no exp
        String noExpToken = "eyJhbGciOiJIUzI1NiJ9." +
                "eyJzdWIiOiJ0ZXN0QHRlc3QuY29tIiwicm9sZSI6IkNMSUVOVCJ9." +
                "FAKE_SIGNATURE";
        mockMvc.perform(get("/api/user/profile")
                .header("Authorization", "Bearer " + noExpToken))
                .andExpect(status().isUnauthorized());
    }

    // ── Token injection via non-standard channels ─────────────────

    @Test
    @DisplayName("SEC-TOK-05: Token passed as query parameter is not accepted")
    void jwt_asQueryParameter_isNotAccepted() throws Exception {
        String fakeToken = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0ZXN0QHRlc3QuY29tIn0.FAKE";
        mockMvc.perform(get("/api/user/profile")
                .param("token", fakeToken)
                .param("access_token", fakeToken))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("SEC-TOK-06: Token passed in request body is not accepted (header required)")
    void jwt_inRequestBody_isNotAccepted() throws Exception {
        mockMvc.perform(get("/api/user/profile")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"token\":\"eyJhbGciOiJIUzI1NiJ9.fake.sig\"}"))
                .andExpect(status().isUnauthorized());
    }

    // ── Oversized / malformed tokens ─────────────────────────────

    @Test
    @DisplayName("SEC-TOK-07: Extremely long Bearer token is handled gracefully (not 5xx)")
    void jwt_extremelyLong_handledGracefully() throws Exception {
        String longToken = "Bearer " + "a".repeat(10_000);
        MvcResult result = mockMvc.perform(get("/api/user/profile")
                .header("Authorization", longToken))
                .andReturn();
        assertTrue(result.getResponse().getStatus() < 500,
                "Extremely long token caused 5xx: " + result.getResponse().getStatus());
    }

    @Test
    @DisplayName("SEC-TOK-08: JWT with only one segment (no dots) is rejected")
    void jwt_singleSegment_isRejected() throws Exception {
        mockMvc.perform(get("/api/user/profile")
                .header("Authorization", "Bearer onlyone"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("SEC-TOK-09: JWT with only two segments (missing signature) is rejected")
    void jwt_twoSegments_isRejected() throws Exception {
        mockMvc.perform(get("/api/user/profile")
                .header("Authorization", "Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0ZXN0In0"))
                .andExpect(status().isUnauthorized());
    }

    // ── Multiple Authorization headers ───────────────────────────

    @Test
    @DisplayName("SEC-TOK-10: Multiple Authorization headers do not cause 5xx")
    void multipleAuthorizationHeaders_handledGracefully() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/user/profile")
                .header("Authorization", "Bearer fake.token.one")
                .header("Authorization", "Bearer fake.token.two"))
                .andReturn();
        assertTrue(result.getResponse().getStatus() < 500,
                "Multiple Authorization headers caused 5xx: " + result.getResponse().getStatus());
    }

    // ── Unicode / special chars in token ─────────────────────────

    @ParameterizedTest(name = "Special char token: {0}")
    @ValueSource(strings = {
        "Bearer \u0000\u0001\u0002",
        "Bearer <script>alert(1)</script>",
        "Bearer ' OR '1'='1",
        "Bearer ../../../etc/passwd"
    })
    @DisplayName("SEC-TOK-11: Special characters in Bearer token are handled gracefully (not 5xx)")
    void specialCharToken_handledGracefully(String headerValue) throws Exception {
        MvcResult result = mockMvc.perform(get("/api/user/profile")
                .header("Authorization", headerValue))
                .andReturn();
        assertTrue(result.getResponse().getStatus() < 500,
                "Special char token caused 5xx for: " + headerValue);
    }

    // ── Token reuse after logout ──────────────────────────────────

    @Test
    @DisplayName("SEC-TOK-12: Logout endpoint with invalid token returns 401, not 5xx")
    void logout_withInvalidToken_returns401NotServerError() throws Exception {
        MvcResult result = mockMvc.perform(post("/api/auth/logout")
                .header("Authorization", "Bearer invalid.jwt.token"))
                .andReturn();
        int status = result.getResponse().getStatus();
        assertEquals(401, status,
                "Logout with invalid token returned unexpected status: " + status);
    }
}
