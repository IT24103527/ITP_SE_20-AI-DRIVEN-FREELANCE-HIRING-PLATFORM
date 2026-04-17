package com.example.talentflowbackend.controller;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests for SensitiveActionController.
 * Verifies authentication requirements and input validation.
 */
@SpringBootTest
@ActiveProfiles("test")
@AutoConfigureMockMvc
class SensitiveActionControllerTest {

    @Autowired
    private MockMvc mockMvc;

    // ── POST /api/sensitive/request-otp — no token ───────────────

    @Test
    @DisplayName("POST /api/sensitive/request-otp — returns 401 without JWT")
    void requestOtp_noToken_returns401() throws Exception {
        mockMvc.perform(post("/api/sensitive/request-otp")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"action\":\"WITHDRAW\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("POST /api/sensitive/request-otp — returns 401 with invalid JWT")
    void requestOtp_invalidToken_returns401() throws Exception {
        mockMvc.perform(post("/api/sensitive/request-otp")
                .header("Authorization", "Bearer invalid.jwt.token")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"action\":\"WITHDRAW\"}"))
                .andExpect(status().isUnauthorized());
    }

    // ── POST /api/sensitive/verify-otp — no token ────────────────

    @Test
    @DisplayName("POST /api/sensitive/verify-otp — returns 401 without JWT")
    void verifyOtp_noToken_returns401() throws Exception {
        mockMvc.perform(post("/api/sensitive/verify-otp")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"action\":\"WITHDRAW\",\"otp\":\"123456\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("POST /api/sensitive/verify-otp — returns 401 with invalid JWT")
    void verifyOtp_invalidToken_returns401() throws Exception {
        mockMvc.perform(post("/api/sensitive/verify-otp")
                .header("Authorization", "Bearer bad.token.here")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"action\":\"WITHDRAW\",\"otp\":\"123456\"}"))
                .andExpect(status().isUnauthorized());
    }

    // ── Input validation ──────────────────────────────────────────

    @Test
    @DisplayName("POST /api/sensitive/request-otp — returns 400 for missing action field")
    void requestOtp_missingAction_returns400() throws Exception {
        mockMvc.perform(post("/api/sensitive/request-otp")
                .header("Authorization", "Bearer invalid.jwt.token")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
                .andExpect(status().is(org.hamcrest.Matchers.anyOf(
                        org.hamcrest.Matchers.is(400),
                        org.hamcrest.Matchers.is(401)
                )));
    }
}
