package com.example.talentflowbackend.security;

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
 * Integration tests for Spring Security configuration.
 *
 * Verifies:
 * - Public auth endpoints are accessible without a token (return 200, not 401)
 * - Protected /api/user/** endpoints return 401 without a valid JWT
 * - Protected endpoints return 401 with a malformed/invalid JWT
 */
@SpringBootTest
@ActiveProfiles("test")
@AutoConfigureMockMvc
class SecurityConfigTest {

    @Autowired
    private MockMvc mockMvc;

    // ── Public endpoints — must NOT return 401 ────────────────────

    @Test
    @DisplayName("POST /api/auth/login is publicly accessible (returns 200)")
    void loginEndpoint_isPublic() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"test@test.com\",\"password\":\"wrong\",\"role\":\"CLIENT\"}"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("POST /api/auth/register/client is publicly accessible (returns 200)")
    void registerClientEndpoint_isPublic() throws Exception {
        mockMvc.perform(post("/api/auth/register/client")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"fullName\":\"T\",\"email\":\"t@t.com\",\"password\":\"Pass1234\"}"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("POST /api/auth/register/freelancer is publicly accessible (returns 200)")
    void registerFreelancerEndpoint_isPublic() throws Exception {
        mockMvc.perform(post("/api/auth/register/freelancer")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"fullName\":\"T\",\"email\":\"t@t.com\",\"password\":\"Pass1234\"}"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("POST /api/auth/register/admin is publicly accessible (returns 200)")
    void registerAdminEndpoint_isPublic() throws Exception {
        mockMvc.perform(post("/api/auth/register/admin")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"fullName\":\"T\",\"email\":\"t@t.com\",\"password\":\"Password1!\",\"adminCode\":\"wrong\",\"department\":\"IT\"}"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("POST /api/auth/verify-login-otp is publicly accessible (returns 200)")
    void verifyOtpEndpoint_isPublic() throws Exception {
        mockMvc.perform(post("/api/auth/verify-login-otp")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"test@test.com\",\"otp\":\"000000\",\"role\":\"CLIENT\"}"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("POST /api/otp/verify is publicly accessible (returns 200 or 400)")
    void otpVerifyEndpoint_isPublic() throws Exception {
        mockMvc.perform(post("/api/otp/verify")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"test@test.com\",\"otp\":\"000000\"}"))
                .andExpect(status().is(org.hamcrest.Matchers.not(401)));
    }

    // ── Protected endpoints — must return 401 without token ───────

    @Test
    @DisplayName("GET /api/user/profile returns 401 without Authorization header")
    void profileEndpoint_noToken_returns401() throws Exception {
        mockMvc.perform(get("/api/user/profile"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("PUT /api/user/profile returns 401 without Authorization header")
    void updateProfileEndpoint_noToken_returns401() throws Exception {
        mockMvc.perform(put("/api/user/profile")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("PUT /api/user/change-password returns 401 without Authorization header")
    void changePasswordEndpoint_noToken_returns401() throws Exception {
        mockMvc.perform(put("/api/user/change-password")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"currentPassword\":\"x\",\"newPassword\":\"y\",\"otp\":\"000000\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("DELETE /api/user/account returns 401 without Authorization header")
    void deleteAccountEndpoint_noToken_returns401() throws Exception {
        mockMvc.perform(delete("/api/user/account"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("GET /api/user/all returns 401 without Authorization header")
    void getAllUsersEndpoint_noToken_returns401() throws Exception {
        mockMvc.perform(get("/api/user/all"))
                .andExpect(status().isUnauthorized());
    }

    // ── Protected endpoints — must return 401 with invalid token ──

    @Test
    @DisplayName("GET /api/user/profile returns 401 with a malformed JWT")
    void profileEndpoint_invalidToken_returns401() throws Exception {
        mockMvc.perform(get("/api/user/profile")
                .header("Authorization", "Bearer this.is.not.valid"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("PUT /api/user/profile returns 401 with a malformed JWT")
    void updateProfileEndpoint_invalidToken_returns401() throws Exception {
        mockMvc.perform(put("/api/user/profile")
                .header("Authorization", "Bearer garbage.token.here")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
                .andExpect(status().isUnauthorized());
    }
}
