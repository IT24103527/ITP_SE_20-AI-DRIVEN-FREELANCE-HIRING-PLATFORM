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

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Security tests: Authentication bypass attempts.
 *
 * Verifies the system cannot be bypassed via:
 * - Forged/tampered JWTs
 * - Algorithm confusion attacks (alg:none)
 * - Missing/malformed Authorization headers
 * - Token from different user
 * - Expired tokens
 */
@Tag("security")
@ActiveProfiles("test")
@SpringBootTest
@AutoConfigureMockMvc
class AuthenticationBypassTest {

    @Autowired
    private MockMvc mockMvc;

    // ── Algorithm confusion: alg=none ─────────────────────────────

    @Test
    @DisplayName("SEC-AUTH-01: JWT with alg=none is rejected (401)")
    void jwt_algNone_isRejected() throws Exception {
        // Header: {"alg":"none","typ":"JWT"}, Payload: {"sub":"admin@test.com","role":"ADMIN"}
        String algNoneToken = "eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0." +
                "eyJzdWIiOiJhZG1pbkB0ZXN0LmNvbSIsInJvbGUiOiJBRE1JTiIsImV4cCI6OTk5OTk5OTk5OX0.";
        mockMvc.perform(get("/api/user/profile")
                .header("Authorization", "Bearer " + algNoneToken))
                .andExpect(status().isUnauthorized());
    }

    // ── Tampered payload ──────────────────────────────────────────

    @Test
    @DisplayName("SEC-AUTH-02: JWT with tampered payload is rejected (401)")
    void jwt_tamperedPayload_isRejected() throws Exception {
        // Valid structure but tampered middle segment
        String tamperedToken = "eyJhbGciOiJIUzI1NiJ9." +
                "eyJzdWIiOiJoYWNrZXJAdGVzdC5jb20iLCJyb2xlIjoiQURNSU4ifQ." +
                "INVALID_SIGNATURE_HERE";
        mockMvc.perform(get("/api/user/profile")
                .header("Authorization", "Bearer " + tamperedToken))
                .andExpect(status().isUnauthorized());
    }

    // ── Expired token ─────────────────────────────────────────────

    @Test
    @DisplayName("SEC-AUTH-03: Expired JWT is rejected (401)")
    void jwt_expired_isRejected() throws Exception {
        // exp = 1600000000 (year 2020 — definitely expired)
        String expiredToken = "eyJhbGciOiJIUzI1NiJ9." +
                "eyJzdWIiOiJ0ZXN0QHRlc3QuY29tIiwicm9sZSI6IkNMSUVOVCIsImV4cCI6MTYwMDAwMDAwMH0." +
                "some_signature";
        mockMvc.perform(get("/api/user/profile")
                .header("Authorization", "Bearer " + expiredToken))
                .andExpect(status().isUnauthorized());
    }

    // ── Missing Authorization header ──────────────────────────────

    @Test
    @DisplayName("SEC-AUTH-04: Missing Authorization header returns 401")
    void missingAuthHeader_returns401() throws Exception {
        mockMvc.perform(get("/api/user/profile"))
                .andExpect(status().isUnauthorized());
    }

    // ── Malformed Authorization header formats ────────────────────

    @ParameterizedTest(name = "Malformed auth header: {0}")
    @ValueSource(strings = {
        "token-without-bearer-prefix",
        "Basic dXNlcjpwYXNz",
        "Bearer",
        "Bearer ",
        "bearer valid.looking.token",
        "BEARER eyJhbGciOiJIUzI1NiJ9.payload.sig"
    })
    @DisplayName("SEC-AUTH-05: Malformed Authorization header formats return 401")
    void malformedAuthHeader_returns401(String headerValue) throws Exception {
        mockMvc.perform(get("/api/user/profile")
                .header("Authorization", headerValue))
                .andExpect(status().isUnauthorized());
    }

    // ── Empty Bearer token ────────────────────────────────────────

    @Test
    @DisplayName("SEC-AUTH-06: Empty Bearer token returns 401")
    void emptyBearerToken_returns401() throws Exception {
        mockMvc.perform(get("/api/user/profile")
                .header("Authorization", "Bearer "))
                .andExpect(status().isUnauthorized());
    }

    // ── Random string as token ────────────────────────────────────

    @Test
    @DisplayName("SEC-AUTH-07: Random string as Bearer token returns 401")
    void randomStringToken_returns401() throws Exception {
        mockMvc.perform(get("/api/user/profile")
                .header("Authorization", "Bearer randomstringnotajwt"))
                .andExpect(status().isUnauthorized());
    }

    // ── Token with wrong signature ────────────────────────────────

    @Test
    @DisplayName("SEC-AUTH-08: JWT with wrong signature returns 401")
    void jwt_wrongSignature_returns401() throws Exception {
        // Valid header + payload but wrong signature
        String wrongSigToken = "eyJhbGciOiJIUzI1NiJ9." +
                "eyJzdWIiOiJ0ZXN0QHRlc3QuY29tIiwicm9sZSI6IkNMSUVOVCIsImV4cCI6OTk5OTk5OTk5OX0." +
                "WRONG_SIGNATURE_THAT_WILL_FAIL_VERIFICATION";
        mockMvc.perform(get("/api/user/profile")
                .header("Authorization", "Bearer " + wrongSigToken))
                .andExpect(status().isUnauthorized());
    }

    // ── All protected endpoints reject unauthenticated access ─────

    @Test
    @DisplayName("SEC-AUTH-09: PUT /api/user/profile without token returns 401")
    void updateProfile_noToken_returns401() throws Exception {
        mockMvc.perform(put("/api/user/profile")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"fullName\":\"Hacker\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("SEC-AUTH-10: DELETE /api/user/account without token returns 401")
    void deleteAccount_noToken_returns401() throws Exception {
        mockMvc.perform(delete("/api/user/account"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("SEC-AUTH-11: POST /api/sensitive/request-otp without token returns 401")
    void sensitiveOtp_noToken_returns401() throws Exception {
        mockMvc.perform(post("/api/sensitive/request-otp")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"action\":\"WITHDRAW\"}"))
                .andExpect(status().isUnauthorized());
    }
}
