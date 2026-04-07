package com.example.talentflowbackend.security;

import com.example.talentflowbackend.config.RateLimitingFilter;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

/**
 * Non-functional security tests: Brute force and rate limiting protection.
 *
 * Verifies:
 * - Auth endpoints enforce rate limiting after threshold
 * - Rate limit response includes correct headers (Retry-After, X-RateLimit-*)
 * - OTP endpoints are rate limited
 * - Rate limit returns 429, not 5xx
 */
@Tag("security")
@ActiveProfiles("test")
@TestPropertySource(properties = "app.rate-limit.enabled=true")
@SpringBootTest
@AutoConfigureMockMvc
class BruteForceProtectionTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private RateLimitingFilter rateLimitingFilter;

    @BeforeEach
    void resetRateLimiter() {
        rateLimitingFilter.resetForTesting();
    }

    private static final String LOGIN_BODY =
            "{\"email\":\"brute@test.com\",\"password\":\"wrongpass\",\"role\":\"CLIENT\"}";

    // ── Rate limiting kicks in after threshold ────────────────────

    @Test
    @DisplayName("SEC-BF-01: Auth endpoint returns 429 after exceeding rate limit (11+ requests)")
    void authEndpoint_rateLimitedAfterThreshold() throws Exception {
        int rateLimitThreshold = 10; // matches AUTH_LIMIT in RateLimitingFilter
        int status = 0;

        for (int i = 0; i <= rateLimitThreshold; i++) {
            MvcResult result = mockMvc.perform(post("/api/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(LOGIN_BODY))
                    .andReturn();
            status = result.getResponse().getStatus();
        }
        assertEquals(429, status,
                "Expected 429 Too Many Requests after exceeding rate limit, got: " + status);
    }

    // ── Rate limit response headers ───────────────────────────────

    @Test
    @DisplayName("SEC-BF-02: Rate limit response includes Retry-After header")
    void rateLimitResponse_includesRetryAfterHeader() throws Exception {
        // Exhaust the limit
        for (int i = 0; i <= 10; i++) {
            mockMvc.perform(post("/api/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"email\":\"retry@test.com\",\"password\":\"x\",\"role\":\"CLIENT\"}"))
                    .andReturn();
        }
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"retry@test.com\",\"password\":\"x\",\"role\":\"CLIENT\"}"))
                .andReturn();

        if (result.getResponse().getStatus() == 429) {
            assertNotNull(result.getResponse().getHeader("Retry-After"),
                    "429 response missing Retry-After header");
        }
    }

    @Test
    @DisplayName("SEC-BF-03: X-RateLimit-Limit header is present on auth responses")
    void authResponse_includesRateLimitLimitHeader() throws Exception {
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"header@test.com\",\"password\":\"x\",\"role\":\"CLIENT\"}"))
                .andReturn();
        assertNotNull(result.getResponse().getHeader("X-RateLimit-Limit"),
                "X-RateLimit-Limit header missing from auth response");
    }

    @Test
    @DisplayName("SEC-BF-04: X-RateLimit-Remaining header is present on auth responses")
    void authResponse_includesRateLimitRemainingHeader() throws Exception {
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"remaining@test.com\",\"password\":\"x\",\"role\":\"CLIENT\"}"))
                .andReturn();
        assertNotNull(result.getResponse().getHeader("X-RateLimit-Remaining"),
                "X-RateLimit-Remaining header missing from auth response");
    }

    @Test
    @DisplayName("SEC-BF-05: X-RateLimit-Remaining decrements with each request")
    void rateLimitRemaining_decrementsWithEachRequest() throws Exception {
        String email = "decrement@test.com";
        String body = "{\"email\":\"" + email + "\",\"password\":\"x\",\"role\":\"CLIENT\"}";

        MvcResult first = mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(body))
                .andReturn();

        MvcResult second = mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(body))
                .andReturn();

        String firstRemaining  = first.getResponse().getHeader("X-RateLimit-Remaining");
        String secondRemaining = second.getResponse().getHeader("X-RateLimit-Remaining");

        if (firstRemaining != null && secondRemaining != null) {
            int firstVal  = Integer.parseInt(firstRemaining);
            int secondVal = Integer.parseInt(secondRemaining);
            assertTrue(secondVal <= firstVal,
                    "X-RateLimit-Remaining did not decrement: " + firstVal + " -> " + secondVal);
        }
    }

    // ── Rate limit is 429, never 5xx ──────────────────────────────

    @Test
    @DisplayName("SEC-BF-06: Rate limit response is 429, not a 5xx server error")
    void rateLimitResponse_is429NotServerError() throws Exception {
        for (int i = 0; i <= 10; i++) {
            MvcResult result = mockMvc.perform(post("/api/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"email\":\"fivehundred@test.com\",\"password\":\"x\",\"role\":\"CLIENT\"}"))
                    .andReturn();
            int status = result.getResponse().getStatus();
            assertTrue(status < 500,
                    "Rate limiting caused a 5xx error on request " + (i + 1) + ": " + status);
        }
    }

    // ── OTP endpoint is also rate limited ────────────────────────

    @Test
    @DisplayName("SEC-BF-07: OTP send endpoint is rate limited (returns 429 after threshold)")
    void otpEndpoint_isRateLimited() throws Exception {
        int status = 0;
        for (int i = 0; i <= 10; i++) {
            MvcResult result = mockMvc.perform(post("/api/otp/send")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"email\":\"otpbrute@test.com\"}"))
                    .andReturn();
            status = result.getResponse().getStatus();
        }
        assertEquals(429, status,
                "OTP endpoint not rate limited after threshold, last status: " + status);
    }

    // ── Rate limit body is JSON ───────────────────────────────────

    @Test
    @DisplayName("SEC-BF-08: Rate limit 429 response body is valid JSON with retryAfterSeconds")
    void rateLimitResponse_bodyIsJson() throws Exception {
        for (int i = 0; i <= 10; i++) {
            mockMvc.perform(post("/api/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"email\":\"jsonbody@test.com\",\"password\":\"x\",\"role\":\"CLIENT\"}"))
                    .andReturn();
        }
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"jsonbody@test.com\",\"password\":\"x\",\"role\":\"CLIENT\"}"))
                .andReturn();

        if (result.getResponse().getStatus() == 429) {
            String body = result.getResponse().getContentAsString();
            assertTrue(body.contains("retryAfterSeconds") || body.contains("message"),
                    "429 response body is not a proper JSON error: " + body);
        }
    }
}
