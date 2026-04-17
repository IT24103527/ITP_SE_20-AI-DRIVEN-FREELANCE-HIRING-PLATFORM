package com.example.talentflowbackend.integration;

import com.example.talentflowbackend.config.RateLimitingFilter;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests for Spring Security configuration.
 * Verifies RBAC, public endpoints, and security headers.
 */
@ActiveProfiles("test")
@TestPropertySource(properties = "app.rate-limit.enabled=true")
@SpringBootTest
@AutoConfigureMockMvc
class SecurityIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private RateLimitingFilter rateLimitingFilter;

    @BeforeEach
    void resetRateLimiter() {
        rateLimitingFilter.resetForTesting();
    }

    // ── Public endpoints — must return 200 (not 401) ──────────────

    @Test
    @DisplayName("SEC-01: POST /api/auth/login is publicly accessible")
    void loginEndpoint_isPublic() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"x@x.com\",\"password\":\"pass\",\"role\":\"CLIENT\"}"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("SEC-02: POST /api/auth/register/client is publicly accessible")
    void registerClientEndpoint_isPublic() throws Exception {
        mockMvc.perform(post("/api/auth/register/client")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"fullName\":\"T\",\"email\":\"t@t.com\",\"password\":\"Pass1234!\"}"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("SEC-03: POST /api/auth/register/freelancer is publicly accessible")
    void registerFreelancerEndpoint_isPublic() throws Exception {
        mockMvc.perform(post("/api/auth/register/freelancer")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"fullName\":\"T\",\"email\":\"t@t.com\",\"password\":\"Pass1234!\"}"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("SEC-04: POST /api/auth/verify-login-otp is publicly accessible")
    void verifyOtpEndpoint_isPublic() throws Exception {
        mockMvc.perform(post("/api/auth/verify-login-otp")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"x@x.com\",\"otp\":\"000000\",\"role\":\"CLIENT\"}"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("SEC-05: POST /api/auth/refresh is publicly accessible")
    void refreshEndpoint_isPublic() throws Exception {
        mockMvc.perform(post("/api/auth/refresh")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"refreshToken\":\"invalid-token\"}"))
                .andExpect(status().isOk()); // returns 200 with error message, not 401
    }

    // ── Protected endpoints — must return 401 without token ───────

    @Test
    @DisplayName("SEC-06: GET /api/user/profile returns 401 without token")
    void userProfile_noToken_returns401() throws Exception {
        mockMvc.perform(get("/api/user/profile"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("SEC-07: PUT /api/user/profile returns 401 without token")
    void updateProfile_noToken_returns401() throws Exception {
        mockMvc.perform(put("/api/user/profile")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("SEC-08: PUT /api/user/change-password returns 401 without token")
    void changePassword_noToken_returns401() throws Exception {
        mockMvc.perform(put("/api/user/change-password")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"currentPassword\":\"x\",\"newPassword\":\"y\",\"otp\":\"000000\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("SEC-09: DELETE /api/user/account returns 401 without token")
    void deleteAccount_noToken_returns401() throws Exception {
        mockMvc.perform(delete("/api/user/account"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("SEC-10: POST /api/sensitive/request-otp returns 401 without token")
    void sensitiveRequestOtp_noToken_returns401() throws Exception {
        mockMvc.perform(post("/api/sensitive/request-otp")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"action\":\"WITHDRAW\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("SEC-11: POST /api/sensitive/verify-otp returns 401 without token")
    void sensitiveVerifyOtp_noToken_returns401() throws Exception {
        mockMvc.perform(post("/api/sensitive/verify-otp")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"action\":\"WITHDRAW\",\"otp\":\"123456\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("SEC-12: GET /api/auth/users returns 401 without token")
    void getAllUsers_noToken_returns401() throws Exception {
        mockMvc.perform(get("/api/auth/users"))
                .andExpect(status().isUnauthorized());
    }

    // ── Invalid token → 401 ───────────────────────────────────────

    @Test
    @DisplayName("SEC-13: GET /api/user/profile with malformed JWT returns 401")
    void userProfile_malformedJwt_returns401() throws Exception {
        mockMvc.perform(get("/api/user/profile")
                .header("Authorization", "Bearer not.a.real.jwt"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("SEC-14: GET /api/user/profile with expired JWT returns 401")
    void userProfile_expiredJwt_returns401() throws Exception {
        // This is a structurally valid but expired JWT (exp in the past)
        String expiredJwt = "eyJhbGciOiJIUzI1NiJ9." +
                "eyJzdWIiOiJ0ZXN0QHRlc3QuY29tIiwicm9sZSI6IkNMSUVOVCIsImV4cCI6MTYwMDAwMDAwMH0." +
                "invalid_signature";
        mockMvc.perform(get("/api/user/profile")
                .header("Authorization", "Bearer " + expiredJwt))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("SEC-15: Authorization header without Bearer prefix returns 401")
    void userProfile_noBearerPrefix_returns401() throws Exception {
        mockMvc.perform(get("/api/user/profile")
                .header("Authorization", "Basic dXNlcjpwYXNz"))
                .andExpect(status().isUnauthorized());
    }

    // ── Security response headers ─────────────────────────────────

    @Test
    @DisplayName("SEC-16: Response includes X-Content-Type-Options: nosniff header")
    void response_hasContentTypeOptionsHeader() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"x@x.com\",\"password\":\"p\",\"role\":\"CLIENT\"}"))
                .andExpect(header().string("X-Content-Type-Options", "nosniff"));
    }

    @Test
    @DisplayName("SEC-17: Response includes X-Frame-Options: DENY header")
    void response_hasFrameOptionsHeader() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"x@x.com\",\"password\":\"p\",\"role\":\"CLIENT\"}"))
                .andExpect(header().string("X-Frame-Options", "DENY"));
    }

    // ── CORS ──────────────────────────────────────────────────────

    @Test
    @DisplayName("SEC-18: OPTIONS preflight from allowed origin returns 200")
    void cors_allowedOrigin_returns200() throws Exception {
        mockMvc.perform(options("/api/auth/login")
                .header("Origin", "http://localhost:3000")
                .header("Access-Control-Request-Method", "POST")
                .header("Access-Control-Request-Headers", "Content-Type"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("SEC-19: OPTIONS preflight from disallowed origin is rejected")
    void cors_disallowedOrigin_isRejected() throws Exception {
        mockMvc.perform(options("/api/auth/login")
                .header("Origin", "http://evil-site.com")
                .header("Access-Control-Request-Method", "POST"))
                .andExpect(status().isForbidden());
    }

    // ── Rate limiting headers ─────────────────────────────────────

    @Test
    @DisplayName("SEC-20: Response includes X-RateLimit-Limit header")
    void response_hasRateLimitHeader() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"x@x.com\",\"password\":\"p\",\"role\":\"CLIENT\"}"))
                .andExpect(header().exists("X-RateLimit-Limit"))
                .andExpect(header().exists("X-RateLimit-Remaining"));
    }
}
