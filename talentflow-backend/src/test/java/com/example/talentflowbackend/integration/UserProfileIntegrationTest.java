package com.example.talentflowbackend.integration;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests for the user profile endpoints.
 * All endpoints require a valid JWT — tests verify 401 behaviour without one.
 */
@ActiveProfiles("test")
@SpringBootTest
@AutoConfigureMockMvc
class UserProfileIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    private static final String FAKE_JWT = "Bearer fake.jwt.token";

    // ── GET /api/user/profile ─────────────────────────────────────

    @Test
    @DisplayName("PRF-01: GET /api/user/profile without token returns 401")
    void getProfile_noToken_returns401() throws Exception {
        mockMvc.perform(get("/api/user/profile"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("PRF-02: GET /api/user/profile with invalid token returns 401")
    void getProfile_invalidToken_returns401() throws Exception {
        mockMvc.perform(get("/api/user/profile")
                .header("Authorization", FAKE_JWT))
                .andExpect(status().isUnauthorized());
    }

    // ── PUT /api/user/profile ─────────────────────────────────────

    @Test
    @DisplayName("PRF-03: PUT /api/user/profile without token returns 401")
    void updateProfile_noToken_returns401() throws Exception {
        mockMvc.perform(put("/api/user/profile")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"fullName\":\"New Name\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("PRF-04: PUT /api/user/profile with invalid token returns 401")
    void updateProfile_invalidToken_returns401() throws Exception {
        mockMvc.perform(put("/api/user/profile")
                .header("Authorization", FAKE_JWT)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"fullName\":\"New Name\"}"))
                .andExpect(status().isUnauthorized());
    }

    // ── PUT /api/user/change-password ─────────────────────────────

    @Test
    @DisplayName("PRF-05: PUT /api/user/change-password without token returns 401")
    void changePassword_noToken_returns401() throws Exception {
        mockMvc.perform(put("/api/user/change-password")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"currentPassword\":\"old\",\"newPassword\":\"new\",\"otp\":\"000000\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("PRF-06: PUT /api/user/change-password with invalid token returns 401")
    void changePassword_invalidToken_returns401() throws Exception {
        mockMvc.perform(put("/api/user/change-password")
                .header("Authorization", FAKE_JWT)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"currentPassword\":\"old\",\"newPassword\":\"new\",\"otp\":\"000000\"}"))
                .andExpect(status().isUnauthorized());
    }

    // ── DELETE /api/user/account ──────────────────────────────────

    @Test
    @DisplayName("PRF-07: DELETE /api/user/account without token returns 401")
    void deleteAccount_noToken_returns401() throws Exception {
        mockMvc.perform(delete("/api/user/account"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("PRF-08: DELETE /api/user/account with invalid token returns 401")
    void deleteAccount_invalidToken_returns401() throws Exception {
        mockMvc.perform(delete("/api/user/account")
                .header("Authorization", FAKE_JWT))
                .andExpect(status().isUnauthorized());
    }

    // ── GET /api/user/all ─────────────────────────────────────────

    @Test
    @DisplayName("PRF-09: GET /api/user/all without token returns 401")
    void getAllUsers_noToken_returns401() throws Exception {
        mockMvc.perform(get("/api/user/all"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("PRF-10: GET /api/user/all with invalid token returns 401")
    void getAllUsers_invalidToken_returns401() throws Exception {
        mockMvc.perform(get("/api/user/all")
                .header("Authorization", FAKE_JWT))
                .andExpect(status().isUnauthorized());
    }
}
