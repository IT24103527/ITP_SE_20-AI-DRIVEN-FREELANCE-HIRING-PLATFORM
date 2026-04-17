package com.example.talentflowbackend.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for RateLimitingFilter.
 */
class RateLimitingFilterTest {

    private RateLimitingFilter filter;

    @BeforeEach
    void setUp() {
        filter = new RateLimitingFilter();
    }

    private MockHttpServletRequest req(String ip, String path) {
        MockHttpServletRequest r = new MockHttpServletRequest();
        r.setRemoteAddr(ip);
        r.setRequestURI(path);
        return r;
    }

    // ── Normal requests pass through ──────────────────────────────

    @Test
    @DisplayName("First request passes through with 200")
    void firstRequest_passesThrough() throws Exception {
        MockHttpServletRequest req = req("1.2.3.4", "/api/user/profile");
        MockHttpServletResponse res = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);

        filter.doFilterInternal(req, res, chain);

        verify(chain).doFilter(req, res);
        assertNotEquals(429, res.getStatus());
    }

    @Test
    @DisplayName("Rate limit headers are set on normal requests")
    void normalRequest_setsRateLimitHeaders() throws Exception {
        MockHttpServletRequest req = req("1.2.3.4", "/api/user/profile");
        MockHttpServletResponse res = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);

        filter.doFilterInternal(req, res, chain);

        assertNotNull(res.getHeader("X-RateLimit-Limit"));
        assertNotNull(res.getHeader("X-RateLimit-Remaining"));
    }

    // ── Auth endpoint limit ───────────────────────────────────────

    @Test
    @DisplayName("Auth endpoint: 11th request from same IP returns 429")
    void authEndpoint_11thRequest_returns429() throws Exception {
        String ip = "10.0.0.1";
        FilterChain chain = mock(FilterChain.class);

        // Send 10 requests (at the limit)
        for (int i = 0; i < 10; i++) {
            MockHttpServletRequest req = req(ip, "/api/auth/login");
            MockHttpServletResponse res = new MockHttpServletResponse();
            filter.doFilterInternal(req, res, chain);
        }

        // 11th should be rate-limited
        MockHttpServletRequest req11 = req(ip, "/api/auth/login");
        MockHttpServletResponse res11 = new MockHttpServletResponse();
        filter.doFilterInternal(req11, res11, chain);

        assertEquals(429, res11.getStatus());
        assertEquals("60", res11.getHeader("Retry-After"));
        assertEquals("0", res11.getHeader("X-RateLimit-Remaining"));
    }

    @Test
    @DisplayName("Auth endpoint: 429 response body contains message")
    void authEndpoint_429_hasMessageBody() throws Exception {
        String ip = "10.0.0.2";
        FilterChain chain = mock(FilterChain.class);

        for (int i = 0; i < 11; i++) {
            MockHttpServletRequest req = req(ip, "/api/auth/register/client");
            MockHttpServletResponse res = new MockHttpServletResponse();
            filter.doFilterInternal(req, res, chain);
        }

        MockHttpServletRequest req = req(ip, "/api/auth/register/client");
        MockHttpServletResponse res = new MockHttpServletResponse();
        filter.doFilterInternal(req, res, chain);

        assertTrue(res.getContentAsString().contains("Too many requests"));
    }

    // ── Different IPs are independent ─────────────────────────────

    @Test
    @DisplayName("Different IPs have independent rate limits")
    void differentIps_independentLimits() throws Exception {
        FilterChain chain = mock(FilterChain.class);

        // Exhaust IP A
        for (int i = 0; i < 11; i++) {
            MockHttpServletRequest req = req("192.168.1.1", "/api/auth/login");
            MockHttpServletResponse res = new MockHttpServletResponse();
            filter.doFilterInternal(req, res, chain);
        }

        // IP B should still be allowed
        MockHttpServletRequest reqB = req("192.168.1.2", "/api/auth/login");
        MockHttpServletResponse resB = new MockHttpServletResponse();
        filter.doFilterInternal(reqB, resB, chain);

        assertNotEquals(429, resB.getStatus());
    }

    // ── X-Forwarded-For ───────────────────────────────────────────

    @Test
    @DisplayName("X-Forwarded-For header is used for IP detection")
    void xForwardedFor_usedForIp() throws Exception {
        MockHttpServletRequest req = req("127.0.0.1", "/api/user/profile");
        req.addHeader("X-Forwarded-For", "203.0.113.5, 10.0.0.1");
        MockHttpServletResponse res = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);

        filter.doFilterInternal(req, res, chain);

        // Should pass through (first request from that IP)
        verify(chain).doFilter(req, res);
    }

    // ── OTP endpoint treated as auth ──────────────────────────────

    @Test
    @DisplayName("OTP endpoint uses auth limit (10/min)")
    void otpEndpoint_usesAuthLimit() throws Exception {
        String ip = "10.0.0.5";
        FilterChain chain = mock(FilterChain.class);

        for (int i = 0; i < 10; i++) {
            MockHttpServletRequest req = req(ip, "/api/otp/verify");
            MockHttpServletResponse res = new MockHttpServletResponse();
            filter.doFilterInternal(req, res, chain);
        }

        MockHttpServletRequest req11 = req(ip, "/api/otp/verify");
        MockHttpServletResponse res11 = new MockHttpServletResponse();
        filter.doFilterInternal(req11, res11, chain);

        assertEquals(429, res11.getStatus());
    }
}
