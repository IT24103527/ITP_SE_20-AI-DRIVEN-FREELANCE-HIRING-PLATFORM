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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Security tests: Injection attack prevention.
 *
 * Verifies the system is resilient against:
 * - NoSQL injection in email/password fields
 * - Script injection (XSS) in input fields
 * - Null byte injection
 * - Oversized payloads
 * - Special character injection
 */
@Tag("security")
@ActiveProfiles("test")
@SpringBootTest
@AutoConfigureMockMvc
class InjectionAttackTest {

    @Autowired
    private MockMvc mockMvc;

    // ── NoSQL injection in email field ────────────────────────────

    @ParameterizedTest(name = "NoSQL injection attempt: {0}")
    @ValueSource(strings = {
        "{\"$gt\": \"\"}",
        "{\"$ne\": null}",
        "{\"$where\": \"1==1\"}",
        "admin@test.com\", \"$or\": [{\"a\":\"b\"}",
        "{\"$regex\": \".*\"}"
    })
    @Tag("security")
    @DisplayName("SEC-INJ-01: NoSQL injection in email field returns 200 or 400, never 5xx")
    void nosqlInjection_emailField_neverCauses5xx(String injection) throws Exception {
        String body = "{\"email\":\"" + injection + "\",\"password\":\"pass\",\"role\":\"CLIENT\"}";
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(body))
                .andReturn();
        int status = result.getResponse().getStatus();
        assertTrue(status < 500, "NoSQL injection caused 5xx: " + status + " for input: " + injection);
    }

    // ── Script injection (XSS) in fullName ────────────────────────

    @ParameterizedTest(name = "XSS attempt in fullName: {0}")
    @ValueSource(strings = {
        "<script>alert('xss')</script>",
        "<img src=x onerror=alert(1)>",
        "javascript:alert(1)",
        "<svg onload=alert(1)>",
        "';alert('xss');//"
    })
    @Tag("security")
    @DisplayName("SEC-INJ-02: XSS in fullName field returns 200 or 400, never 5xx, never echoes script")
    void xssInjection_fullNameField_neverEchosScript(String xss) throws Exception {
        String body = "{\"fullName\":\"" + xss.replace("\"", "\\\"") +
                "\",\"email\":\"xss@test.com\",\"password\":\"Pass1!\"}";
        MvcResult result = mockMvc.perform(post("/api/auth/register/client")
                .contentType(MediaType.APPLICATION_JSON)
                .content(body))
                .andReturn();
        int status = result.getResponse().getStatus();
        assertTrue(status < 500, "XSS input caused 5xx: " + status);
        // Response must not echo raw script tags
        String responseBody = result.getResponse().getContentAsString();
        assertFalse(responseBody.contains("<script>"),
                "Response echoed raw <script> tag");
    }

    // ── Null byte injection ───────────────────────────────────────

    @Test
    @DisplayName("SEC-INJ-03: Null byte in email field handled gracefully")
    void nullByteInjection_emailField_handledGracefully() throws Exception {
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"admin\\u0000@test.com\",\"password\":\"pass\",\"role\":\"CLIENT\"}"))
                .andReturn();
        assertTrue(result.getResponse().getStatus() < 500,
                "Null byte caused 5xx: " + result.getResponse().getStatus());
    }

    // ── Oversized payload ─────────────────────────────────────────

    @Test
    @DisplayName("SEC-INJ-04: 100KB email field handled gracefully (not 5xx)")
    void oversizedEmail_handledGracefully() throws Exception {
        String hugeEmail = "a".repeat(100_000) + "@test.com";
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"" + hugeEmail + "\",\"password\":\"pass\",\"role\":\"CLIENT\"}"))
                .andReturn();
        assertTrue(result.getResponse().getStatus() < 500,
                "Oversized email caused 5xx: " + result.getResponse().getStatus());
    }

    // ── SQL-like injection patterns ───────────────────────────────

    @ParameterizedTest(name = "SQL injection attempt: {0}")
    @ValueSource(strings = {
        "' OR '1'='1",
        "'; DROP TABLE users; --",
        "admin'--",
        "1' UNION SELECT * FROM users--",
        "' OR 1=1--"
    })
    @Tag("security")
    @DisplayName("SEC-INJ-05: SQL-like injection in password field returns 200 or 400, never 5xx")
    void sqlInjection_passwordField_neverCauses5xx(String injection) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"test@test.com\",\"password\":\"" +
                        injection.replace("\"", "\\\"") + "\",\"role\":\"CLIENT\"}"))
                .andReturn();
        assertTrue(result.getResponse().getStatus() < 500,
                "SQL injection caused 5xx for: " + injection);
    }

    // ── JSON injection ────────────────────────────────────────────

    @Test
    @DisplayName("SEC-INJ-06: JSON injection attempt in role field handled gracefully")
    void jsonInjection_roleField_handledGracefully() throws Exception {
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"test@test.com\",\"password\":\"pass\",\"role\":\"CLIENT\",\"role\":\"ADMIN\"}"))
                .andReturn();
        assertTrue(result.getResponse().getStatus() < 500,
                "JSON injection caused 5xx: " + result.getResponse().getStatus());
    }
}
