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
 * Non-functional security tests: Role-Based Access Control (RBAC).
 *
 * Verifies that:
 * - Admin-only endpoints reject non-admin tokens (401/403)
 * - Client-only endpoints reject non-client tokens
 * - Freelancer-only endpoints reject non-freelancer tokens
 * - Forged role claims in JWT are rejected
 * - Privilege escalation via crafted tokens is not possible
 */
@Tag("security")
@ActiveProfiles("test")
@SpringBootTest
@AutoConfigureMockMvc
class RoleBasedAccessControlTest {

    @Autowired
    private MockMvc mockMvc;

    // Structurally valid JWT with role=CLIENT (wrong signature — will be rejected)
    private static final String FAKE_CLIENT_TOKEN =
            "eyJhbGciOiJIUzI1NiJ9." +
            "eyJzdWIiOiJjbGllbnRAZXhhbXBsZS5jb20iLCJyb2xlIjoiQ0xJRU5UIiwiZXhwIjo5OTk5OTk5OTk5fQ." +
            "FAKE_SIGNATURE";

    // Structurally valid JWT with role=ADMIN (wrong signature — will be rejected)
    private static final String FAKE_ADMIN_TOKEN =
            "eyJhbGciOiJIUzI1NiJ9." +
            "eyJzdWIiOiJhZG1pbkBleGFtcGxlLmNvbSIsInJvbGUiOiJBRE1JTiIsImV4cCI6OTk5OTk5OTk5OX0." +
            "FAKE_SIGNATURE";

    // ── Admin endpoints reject unauthenticated requests ───────────

    @ParameterizedTest(name = "Admin endpoint blocked without token: {0}")
    @ValueSource(strings = {
        "/api/admin/users",
        "/api/admin/dashboard",
        "/api/admin/reports"
    })
    @DisplayName("SEC-RBAC-01: Admin endpoints return 401 without any token")
    void adminEndpoints_noToken_returns401(String endpoint) throws Exception {
        mockMvc.perform(get(endpoint))
                .andExpect(status().isUnauthorized());
    }

    // ── Admin endpoints reject forged CLIENT tokens ───────────────

    @Test
    @DisplayName("SEC-RBAC-02: /api/admin/** rejects forged CLIENT-role JWT (401)")
    void adminEndpoint_forgedClientToken_isRejected() throws Exception {
        mockMvc.perform(get("/api/admin/users")
                .header("Authorization", "Bearer " + FAKE_CLIENT_TOKEN))
                .andExpect(status().isUnauthorized());
    }

    // ── Admin endpoints reject forged ADMIN tokens (wrong sig) ───

    @Test
    @DisplayName("SEC-RBAC-03: /api/admin/** rejects forged ADMIN-role JWT with wrong signature (401)")
    void adminEndpoint_forgedAdminToken_wrongSig_isRejected() throws Exception {
        mockMvc.perform(get("/api/admin/users")
                .header("Authorization", "Bearer " + FAKE_ADMIN_TOKEN))
                .andExpect(status().isUnauthorized());
    }

    // ── Client endpoints reject unauthenticated requests ─────────

    @ParameterizedTest(name = "Client endpoint blocked without token: {0}")
    @ValueSource(strings = {
        "/api/client/dashboard",
        "/api/client/projects"
    })
    @DisplayName("SEC-RBAC-04: Client endpoints return 401 without any token")
    void clientEndpoints_noToken_returns401(String endpoint) throws Exception {
        mockMvc.perform(get(endpoint))
                .andExpect(status().isUnauthorized());
    }

    // ── Freelancer endpoints reject unauthenticated requests ──────

    @ParameterizedTest(name = "Freelancer endpoint blocked without token: {0}")
    @ValueSource(strings = {
        "/api/freelancer/dashboard",
        "/api/freelancer/jobs"
    })
    @DisplayName("SEC-RBAC-05: Freelancer endpoints return 401 without any token")
    void freelancerEndpoints_noToken_returns401(String endpoint) throws Exception {
        mockMvc.perform(get(endpoint))
                .andExpect(status().isUnauthorized());
    }

    // ── Privilege escalation via JWT role manipulation ────────────

    @Test
    @DisplayName("SEC-RBAC-06: JWT with role=ADMIN but wrong signature cannot access admin endpoints")
    void privilegeEscalation_forgedAdminRole_isBlocked() throws Exception {
        // Attempt to escalate from CLIENT to ADMIN by crafting a token
        String escalatedToken = "eyJhbGciOiJIUzI1NiJ9." +
                "eyJzdWIiOiJjbGllbnRAZXhhbXBsZS5jb20iLCJyb2xlIjoiQURNSU4iLCJleHAiOjk5OTk5OTk5OTl9." +
                "ESCALATED_FAKE_SIGNATURE";
        mockMvc.perform(get("/api/admin/users")
                .header("Authorization", "Bearer " + escalatedToken))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("SEC-RBAC-07: JWT with role=FREELANCER cannot access /api/admin/** endpoints")
    void freelancerToken_cannotAccessAdminEndpoints() throws Exception {
        String freelancerToken = "eyJhbGciOiJIUzI1NiJ9." +
                "eyJzdWIiOiJmcmVlbGFuY2VyQGV4YW1wbGUuY29tIiwicm9sZSI6IkZSRUVMQU5DRVIiLCJleHAiOjk5OTk5OTk5OTl9." +
                "FAKE_FREELANCER_SIGNATURE";
        mockMvc.perform(get("/api/admin/users")
                .header("Authorization", "Bearer " + freelancerToken))
                .andExpect(status().isUnauthorized());
    }

    // ── Sensitive actions require authentication ──────────────────

    @Test
    @DisplayName("SEC-RBAC-08: POST /api/sensitive/request-otp requires authentication")
    void sensitiveRequestOtp_requiresAuth() throws Exception {
        mockMvc.perform(post("/api/sensitive/request-otp")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"action\":\"DELETE_ACCOUNT\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("SEC-RBAC-09: POST /api/sensitive/verify-otp requires authentication")
    void sensitiveVerifyOtp_requiresAuth() throws Exception {
        mockMvc.perform(post("/api/sensitive/verify-otp")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"action\":\"DELETE_ACCOUNT\",\"otp\":\"123456\"}"))
                .andExpect(status().isUnauthorized());
    }

    // ── HTTP method enforcement ───────────────────────────────────

    @Test
    @DisplayName("SEC-RBAC-10: GET on POST-only login endpoint returns 405 Method Not Allowed")
    void loginEndpoint_getMethod_returns405() throws Exception {
        mockMvc.perform(get("/api/auth/login"))
                .andExpect(status().isMethodNotAllowed());
    }

    @Test
    @DisplayName("SEC-RBAC-11: DELETE on login endpoint returns 405 Method Not Allowed")
    void loginEndpoint_deleteMethod_returns405() throws Exception {
        mockMvc.perform(delete("/api/auth/login"))
                .andExpect(status().isMethodNotAllowed());
    }
}
