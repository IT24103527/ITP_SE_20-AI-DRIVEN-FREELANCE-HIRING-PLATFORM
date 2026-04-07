package com.example.talentflowbackend.integration;

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
 * Integration tests for the token refresh endpoint.
 */
@ActiveProfiles("test")
@SpringBootTest
@AutoConfigureMockMvc
class TokenRefreshIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    // ── Invalid refresh tokens ────────────────────────────────────

    @Test
    @DisplayName("TKN-01: Refresh with completely unknown token returns 200 with error message")
    void refresh_unknownToken_returnsError() throws Exception {
        mockMvc.perform(post("/api/auth/refresh")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"refreshToken\":\"unknown-token-xyz-123\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").exists())
                .andExpect(jsonPath("$.token").doesNotExist())
                .andExpect(jsonPath("$.refreshToken").doesNotExist());
    }

    @Test
    @DisplayName("TKN-02: Refresh with empty string token returns 400")
    void refresh_emptyToken_returns400() throws Exception {
        mockMvc.perform(post("/api/auth/refresh")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"refreshToken\":\"\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("TKN-03: Refresh with missing refreshToken field returns 400")
    void refresh_missingField_returns400() throws Exception {
        mockMvc.perform(post("/api/auth/refresh")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("TKN-04: Refresh with null refreshToken returns 400")
    void refresh_nullToken_returns400() throws Exception {
        mockMvc.perform(post("/api/auth/refresh")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"refreshToken\":null}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("TKN-05: Refresh with UUID-format but non-existent token returns error message")
    void refresh_uuidFormatButNonExistent_returnsError() throws Exception {
        mockMvc.perform(post("/api/auth/refresh")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"refreshToken\":\"550e8400-e29b-41d4-a716-446655440000\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Invalid refresh token."));
    }

    // ── Logout endpoint ───────────────────────────────────────────

    @Test
    @DisplayName("TKN-06: Logout without token returns 401")
    void logout_noToken_returns401() throws Exception {
        mockMvc.perform(post("/api/auth/logout")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"refreshToken\":\"some-token\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("TKN-07: Logout with invalid JWT returns 401")
    void logout_invalidJwt_returns401() throws Exception {
        mockMvc.perform(post("/api/auth/logout")
                .header("Authorization", "Bearer invalid.jwt.here")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"refreshToken\":\"some-token\"}"))
                .andExpect(status().isUnauthorized());
    }
}
