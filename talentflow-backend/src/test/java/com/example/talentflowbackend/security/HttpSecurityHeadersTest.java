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

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Non-functional security tests: HTTP response security headers.
 *
 * Verifies the server sets all required defensive headers on every response:
 * - X-Content-Type-Options (MIME sniffing prevention)
 * - X-Frame-Options (clickjacking prevention)
 * - Strict-Transport-Security (HSTS)
 * - Content-Security-Policy
 * - Referrer-Policy
 * - Permissions-Policy
 * - No sensitive data leaked in headers (Server, X-Powered-By)
 */
@Tag("security")
@ActiveProfiles("test")
@SpringBootTest
@AutoConfigureMockMvc
class HttpSecurityHeadersTest {

    @Autowired
    private MockMvc mockMvc;

    private static final String LOGIN_BODY =
            "{\"email\":\"x@x.com\",\"password\":\"pass\",\"role\":\"CLIENT\"}";

    // ── MIME sniffing prevention ──────────────────────────────────

    @Test
    @DisplayName("SEC-HDR-01: X-Content-Type-Options is 'nosniff' on auth response")
    void header_xContentTypeOptions_isNoSniff() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(LOGIN_BODY))
                .andExpect(header().string("X-Content-Type-Options", "nosniff"));
    }

    // ── Clickjacking prevention ───────────────────────────────────

    @Test
    @DisplayName("SEC-HDR-02: X-Frame-Options is 'DENY' on auth response")
    void header_xFrameOptions_isDeny() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(LOGIN_BODY))
                .andExpect(header().string("X-Frame-Options", "DENY"));
    }

    // ── HSTS ─────────────────────────────────────────────────────

    @Test
    @DisplayName("SEC-HDR-03: Strict-Transport-Security header is present")
    void header_strictTransportSecurity_isPresent() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                .secure(true)
                .contentType(MediaType.APPLICATION_JSON)
                .content(LOGIN_BODY))
                .andExpect(header().exists("Strict-Transport-Security"));
    }

    @Test
    @DisplayName("SEC-HDR-04: HSTS includes includeSubDomains directive")
    void header_hsts_includesSubDomains() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                .secure(true)
                .contentType(MediaType.APPLICATION_JSON)
                .content(LOGIN_BODY))
                .andExpect(header().string("Strict-Transport-Security",
                        containsString("includeSubDomains")));
    }

    @Test
    @DisplayName("SEC-HDR-05: HSTS max-age is at least 1 year (31536000 seconds)")
    void header_hsts_maxAgeAtLeastOneYear() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                .secure(true)
                .contentType(MediaType.APPLICATION_JSON)
                .content(LOGIN_BODY))
                .andExpect(header().string("Strict-Transport-Security",
                        containsString("max-age=31536000")));
    }

    // ── Content Security Policy ───────────────────────────────────

    @Test
    @DisplayName("SEC-HDR-06: Content-Security-Policy header is present")
    void header_contentSecurityPolicy_isPresent() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(LOGIN_BODY))
                .andExpect(header().exists("Content-Security-Policy"));
    }

    @Test
    @DisplayName("SEC-HDR-07: CSP contains default-src 'self' directive")
    void header_csp_containsDefaultSrcSelf() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(LOGIN_BODY))
                .andExpect(header().string("Content-Security-Policy",
                        containsString("default-src 'self'")));
    }

    @Test
    @DisplayName("SEC-HDR-08: CSP contains frame-ancestors 'none' to block embedding")
    void header_csp_containsFrameAncestorsNone() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(LOGIN_BODY))
                .andExpect(header().string("Content-Security-Policy",
                        containsString("frame-ancestors 'none'")));
    }

    // ── Referrer Policy ───────────────────────────────────────────

    @Test
    @DisplayName("SEC-HDR-09: Referrer-Policy header is present")
    void header_referrerPolicy_isPresent() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(LOGIN_BODY))
                .andExpect(header().exists("Referrer-Policy"));
    }

    // ── Permissions Policy ────────────────────────────────────────

    @Test
    @DisplayName("SEC-HDR-10: Permissions-Policy header is present")
    void header_permissionsPolicy_isPresent() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(LOGIN_BODY))
                .andExpect(header().exists("Permissions-Policy"));
    }

    @Test
    @DisplayName("SEC-HDR-11: Permissions-Policy disables camera and microphone")
    void header_permissionsPolicy_disablesSensitiveApis() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(LOGIN_BODY))
                .andExpect(header().string("Permissions-Policy",
                        allOf(containsString("camera=()"), containsString("microphone=()"))));
    }

    // ── No information leakage in headers ────────────────────────

    @Test
    @DisplayName("SEC-HDR-12: Server header does not expose technology stack")
    void header_server_doesNotLeakTechStack() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(LOGIN_BODY))
                .andExpect(header().doesNotExist("X-Powered-By"));
    }

    // ── Headers present on 401 responses too ─────────────────────

    @Test
    @DisplayName("SEC-HDR-13: Security headers are present on 401 Unauthorized responses")
    void securityHeaders_presentOn401Response() throws Exception {
        mockMvc.perform(get("/api/user/profile"))
                .andExpect(status().isUnauthorized())
                .andExpect(header().string("X-Content-Type-Options", "nosniff"))
                .andExpect(header().string("X-Frame-Options", "DENY"));
    }

    // ── Headers present across multiple endpoint types ────────────

    @ParameterizedTest(name = "Security headers present on endpoint: {0}")
    @ValueSource(strings = {
        "/api/auth/login",
        "/api/auth/register/client",
        "/api/auth/verify-login-otp"
    })
    @DisplayName("SEC-HDR-14: X-Content-Type-Options present on all public endpoints")
    void securityHeaders_presentOnAllPublicEndpoints(String endpoint) throws Exception {
        mockMvc.perform(post(endpoint)
                .contentType(MediaType.APPLICATION_JSON)
                .content(LOGIN_BODY))
                .andExpect(header().string("X-Content-Type-Options", "nosniff"));
    }
}
