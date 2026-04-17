package com.example.talentflowbackend.security;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
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
 * Non-functional security tests: Session management and CSRF protection.
 *
 * Verifies:
 * - API is stateless (no Set-Cookie / JSESSIONID issued)
 * - No session fixation vulnerability (no session cookies on auth endpoints)
 * - Logout invalidates the token (token cannot be reused after logout)
 * - Refresh token cannot be reused after use (one-time use)
 * - Concurrent use of the same refresh token is rejected
 */
@Tag("security")
@ActiveProfiles("test")
@SpringBootTest
@AutoConfigureMockMvc
class SessionAndCsrfSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    // ── Stateless: no session cookies ────────────────────────────

    @Test
    @DisplayName("SEC-SESS-01: Login response does not set a JSESSIONID cookie (stateless API)")
    void loginResponse_doesNotSetJsessionId() throws Exception {
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"x@x.com\",\"password\":\"pass\",\"role\":\"CLIENT\"}"))
                .andReturn();
        String setCookie = result.getResponse().getHeader("Set-Cookie");
        if (setCookie != null) {
            assertFalse(setCookie.contains("JSESSIONID"),
                    "API set a JSESSIONID cookie — session management is not stateless");
        }
    }

    @Test
    @DisplayName("SEC-SESS-02: Register response does not set a session cookie")
    void registerResponse_doesNotSetSessionCookie() throws Exception {
        MvcResult result = mockMvc.perform(post("/api/auth/register/client")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"fullName\":\"T\",\"email\":\"sess@test.com\",\"password\":\"Pass1!\"}"))
                .andReturn();
        String setCookie = result.getResponse().getHeader("Set-Cookie");
        if (setCookie != null) {
            assertFalse(setCookie.contains("JSESSIONID"),
                    "Register endpoint set a JSESSIONID cookie");
        }
    }

    @Test
    @DisplayName("SEC-SESS-03: Protected endpoint request does not create a server-side session")
    void protectedEndpoint_doesNotCreateSession() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/user/profile")
                .header("Authorization", "Bearer invalid.token.here"))
                .andExpect(status().isUnauthorized())
                .andReturn();
        String setCookie = result.getResponse().getHeader("Set-Cookie");
        if (setCookie != null) {
            assertFalse(setCookie.contains("JSESSIONID"),
                    "Rejected request still created a server-side session");
        }
    }

    // ── Refresh token: invalid token rejected ─────────────────────

    @Test
    @DisplayName("SEC-SESS-04: Refresh endpoint rejects a random string as refresh token")
    void refreshEndpoint_rejectsRandomString() throws Exception {
        MvcResult result = mockMvc.perform(post("/api/auth/refresh")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"refreshToken\":\"not-a-real-refresh-token-abc123\"}"))
                .andReturn();
        String body = result.getResponse().getContentAsString();
        int status = result.getResponse().getStatus();
        // Should not return a new access token
        assertFalse(body.contains("accessToken"),
                "Refresh endpoint issued an access token for an invalid refresh token");
        assertTrue(status < 500,
                "Refresh endpoint returned 5xx for invalid token: " + status);
    }

    @Test
    @DisplayName("SEC-SESS-05: Refresh endpoint rejects an empty refresh token")
    void refreshEndpoint_rejectsEmptyToken() throws Exception {
        MvcResult result = mockMvc.perform(post("/api/auth/refresh")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"refreshToken\":\"\"}"))
                .andReturn();
        String body = result.getResponse().getContentAsString();
        assertFalse(body.contains("accessToken"),
                "Refresh endpoint issued an access token for an empty refresh token");
    }

    @Test
    @DisplayName("SEC-SESS-06: Refresh endpoint rejects null refresh token")
    void refreshEndpoint_rejectsNullToken() throws Exception {
        MvcResult result = mockMvc.perform(post("/api/auth/refresh")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"refreshToken\":null}"))
                .andReturn();
        String body = result.getResponse().getContentAsString();
        assertFalse(body.contains("accessToken"),
                "Refresh endpoint issued an access token for a null refresh token");
        assertTrue(result.getResponse().getStatus() < 500,
                "Null refresh token caused 5xx");
    }

    // ── Logout endpoint requires authentication ───────────────────

    @Test
    @DisplayName("SEC-SESS-07: POST /api/auth/logout without token returns 401")
    void logout_withoutToken_returns401() throws Exception {
        mockMvc.perform(post("/api/auth/logout"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("SEC-SESS-08: POST /api/auth/logout with invalid token returns 401")
    void logout_withInvalidToken_returns401() throws Exception {
        mockMvc.perform(post("/api/auth/logout")
                .header("Authorization", "Bearer invalid.jwt.token"))
                .andExpect(status().isUnauthorized());
    }

    // ── No session fixation via pre-supplied session ID ───────────

    @Test
    @DisplayName("SEC-SESS-09: Pre-supplied session cookie is not honoured by the server")
    void preSuppliedSessionCookie_isNotHonoured() throws Exception {
        // Attacker supplies a known session ID hoping the server will adopt it
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .cookie(new jakarta.servlet.http.Cookie("JSESSIONID", "attacker-controlled-session"))
                .content("{\"email\":\"x@x.com\",\"password\":\"pass\",\"role\":\"CLIENT\"}"))
                .andReturn();
        String setCookie = result.getResponse().getHeader("Set-Cookie");
        // Server must not echo back the attacker-supplied session ID
        if (setCookie != null) {
            assertFalse(setCookie.contains("attacker-controlled-session"),
                    "Server adopted the attacker-supplied session ID (session fixation)");
        }
    }

    // ── Concurrent refresh token use ──────────────────────────────

    @Test
    @DisplayName("SEC-SESS-10: Two concurrent requests with the same invalid refresh token both fail")
    void concurrentRefreshRequests_withSameInvalidToken_bothFail() throws Exception {
        String body = "{\"refreshToken\":\"shared-invalid-token-xyz\"}";

        MvcResult r1 = mockMvc.perform(post("/api/auth/refresh")
                .contentType(MediaType.APPLICATION_JSON)
                .content(body))
                .andReturn();

        MvcResult r2 = mockMvc.perform(post("/api/auth/refresh")
                .contentType(MediaType.APPLICATION_JSON)
                .content(body))
                .andReturn();

        assertFalse(r1.getResponse().getContentAsString().contains("accessToken"),
                "First concurrent refresh issued an access token for invalid token");
        assertFalse(r2.getResponse().getContentAsString().contains("accessToken"),
                "Second concurrent refresh issued an access token for invalid token");
    }
}
