package com.example.talentflowbackend.controller;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests for AuthController endpoints.
 * Tests the full HTTP request/response cycle including validation and error handling.
 */
@SpringBootTest
@ActiveProfiles("test")
@AutoConfigureMockMvc
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    // ── POST /api/auth/login ──────────────────────────────────────

    @Test
    @DisplayName("POST /api/auth/login — returns 200 with message for unknown email")
    void login_unknownEmail_returns200WithMessage() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"nobody@nowhere.com\",\"password\":\"Pass1\",\"role\":\"CLIENT\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Invalid email or password."));
    }

    @Test
    @DisplayName("POST /api/auth/login — returns 400 for blank email")
    void login_blankEmail_returns400() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"\",\"password\":\"Pass1\",\"role\":\"CLIENT\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /api/auth/login — returns 400 for blank password")
    void login_blankPassword_returns400() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"test@test.com\",\"password\":\"\",\"role\":\"CLIENT\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /api/auth/login — returns 200 with 'Role is required' for missing role")
    void login_missingRole_returns200WithRoleMessage() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"test@test.com\",\"password\":\"Pass1\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Role is required to log in."));
    }

    // ── POST /api/auth/verify-login-otp ──────────────────────────

    @Test
    @DisplayName("POST /api/auth/verify-login-otp — returns 200 with error for unknown user")
    void verifyOtp_unknownUser_returns200WithError() throws Exception {
        mockMvc.perform(post("/api/auth/verify-login-otp")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"ghost@test.com\",\"otp\":\"123456\",\"role\":\"CLIENT\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").exists())
                .andExpect(jsonPath("$.token").doesNotExist());
    }

    // ── POST /api/auth/register/client ────────────────────────────

    @Test
    @DisplayName("POST /api/auth/register/client — returns 400 for missing fullName")
    void registerClient_missingFullName_returns400() throws Exception {
        mockMvc.perform(post("/api/auth/register/client")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"test@test.com\",\"password\":\"Pass1\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /api/auth/register/client — returns 400 for missing password")
    void registerClient_missingPassword_returns400() throws Exception {
        mockMvc.perform(post("/api/auth/register/client")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"fullName\":\"Test\",\"email\":\"test@test.com\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /api/auth/register/client — successful registration returns qrCode")
    void registerClient_validRequest_returnsQrCode() throws Exception {
        String email = "newclient_ctrl_" + UUID.randomUUID() + "@talentflow.test";
        mockMvc.perform(post("/api/auth/register/client")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"fullName\":\"New Client\",\"email\":\"" + email + "\",\"password\":\"Password1\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.qrCode").exists())
                .andExpect(jsonPath("$.totpSecret").exists())
                .andExpect(jsonPath("$.role").value("CLIENT"));
    }

    // ── POST /api/auth/register/freelancer ──────────────────────

    @Test
    @DisplayName("POST /api/auth/register/freelancer — successful registration returns qrCode")
    void registerFreelancer_validRequest_returnsQrCode() throws Exception {
        String email = "newfl_ctrl_" + UUID.randomUUID() + "@talentflow.test";
        mockMvc.perform(post("/api/auth/register/freelancer")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"fullName\":\"New FL\",\"email\":\"" + email + "\",\"password\":\"Password1\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.qrCode").exists())
                .andExpect(jsonPath("$.role").value("FREELANCER"));
    }

    // ── POST /api/auth/register/admin ─────────────────────────────

    @Test
    @DisplayName("POST /api/auth/register/admin — wrong code returns 200 with error message")
    void registerAdmin_wrongCode_returns200WithError() throws Exception {
        String email = "admin_ctrl_" + UUID.randomUUID() + "@test.com";
        mockMvc.perform(post("/api/auth/register/admin")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"fullName\":\"Admin\",\"email\":\"" + email + "\",\"password\":\"Password1!\",\"adminCode\":\"WRONG\",\"department\":\"IT\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Invalid admin registration code."));
    }

    @Test
    @DisplayName("POST /api/auth/register/admin — missing adminCode returns 400")
    void registerAdmin_missingCode_returns400() throws Exception {
        String email = "admin_mc_" + UUID.randomUUID() + "@test.com";
        mockMvc.perform(post("/api/auth/register/admin")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"fullName\":\"Admin\",\"email\":\"" + email + "\",\"password\":\"Pass1\",\"department\":\"IT\"}"))
                .andExpect(status().isBadRequest());
    }

    // ── POST /api/auth/refresh ────────────────────────────────────

    @Test
    @DisplayName("POST /api/auth/refresh — invalid token returns 200 with error message")
    void refresh_invalidToken_returns200WithError() throws Exception {
        mockMvc.perform(post("/api/auth/refresh")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"refreshToken\":\"completely-invalid-token\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").exists())
                .andExpect(jsonPath("$.token").doesNotExist());
    }

    @Test
    @DisplayName("POST /api/auth/refresh — missing refreshToken returns 400")
    void refresh_missingToken_returns400() throws Exception {
        mockMvc.perform(post("/api/auth/refresh")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
                .andExpect(status().isBadRequest());
    }
}
