package com.example.talentflowbackend.integration;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests for the full authentication flow.
 *
 * Tests run against the real Spring context (no mocks).
 * MongoDB must be running on localhost:27017.
 *
 * Test order:
 *  1. Register client
 *  2. Register same email as freelancer (multi-role)
 *  3. Login with wrong password
 *  4. Login with correct password → OTP required
 *  5. Verify OTP with wrong code
 *  6. Refresh token with invalid token
 *  7. Access protected endpoint without token → 401
 *  8. Access protected endpoint with invalid token → 401
 */
@ActiveProfiles("test")
@SpringBootTest
@AutoConfigureMockMvc
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class AuthIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    private static final String TEST_EMAIL = "integration_auth_" + System.currentTimeMillis() + "@talentflow.test";
    private static final String TEST_PASSWORD = "IntegrationPass1!";

    // ── 1. Register client ────────────────────────────────────────

    @Test
    @Order(1)
    @DisplayName("IT-01: Register new client returns 200 with qrCode and totpSecret")
    void registerClient_newEmail_returnsQrCode() throws Exception {
        mockMvc.perform(post("/api/auth/register/client")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                        "fullName": "Integration Client",
                        "email": "%s",
                        "password": "%s",
                        "phoneNumber": "+94771234567"
                    }
                    """.formatted(TEST_EMAIL, TEST_PASSWORD)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.qrCode").exists())
                .andExpect(jsonPath("$.totpSecret").exists())
                .andExpect(jsonPath("$.role").value("CLIENT"));
    }

    // ── 2. Register same email as freelancer ──────────────────────

    @Test
    @Order(2)
    @DisplayName("IT-02: Register same email as freelancer adds freelancer role")
    void registerFreelancer_sameEmail_addsRole() throws Exception {
        mockMvc.perform(post("/api/auth/register/freelancer")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                        "fullName": "Integration Client",
                        "email": "%s",
                        "password": "FreelancerPass1!",
                        "professionalTitle": "Developer"
                    }
                    """.formatted(TEST_EMAIL)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value(
                        "Freelancer account created! Use your new Freelancer password + authenticator app to log in."));
    }

    // ── 3. Register same email + same role → already exists ───────

    @Test
    @Order(3)
    @DisplayName("IT-03: Register same email + same role returns 'already exists' message")
    void registerClient_duplicateRole_returnsAlreadyExists() throws Exception {
        mockMvc.perform(post("/api/auth/register/client")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                        "fullName": "Integration Client",
                        "email": "%s",
                        "password": "%s"
                    }
                    """.formatted(TEST_EMAIL, TEST_PASSWORD)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("A Client account already exists for this email."));
    }

    // ── 4. Login with wrong password ──────────────────────────────

    @Test
    @Order(4)
    @DisplayName("IT-04: Login with wrong password returns attempt count message")
    void login_wrongPassword_returnsAttemptMessage() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                        "email": "%s",
                        "password": "WrongPassword!",
                        "role": "CLIENT"
                    }
                    """.formatted(TEST_EMAIL)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value(containsString("attempt(s) remaining")))
                .andExpect(jsonPath("$.token").doesNotExist());
    }

    // ── 5. Login with correct password → OTP required ─────────────

    @Test
    @Order(5)
    @DisplayName("IT-05: Login with correct password returns otpRequired=true")
    void login_correctPassword_returnsOtpRequired() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                        "email": "%s",
                        "password": "%s",
                        "role": "CLIENT"
                    }
                    """.formatted(TEST_EMAIL, TEST_PASSWORD)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.otpRequired").value(true))
                .andExpect(jsonPath("$.token").doesNotExist());
    }

    // ── 6. Verify OTP with wrong code ─────────────────────────────

    @Test
    @Order(6)
    @DisplayName("IT-06: Verify OTP with wrong code returns attempt count message")
    void verifyOtp_wrongCode_returnsAttemptMessage() throws Exception {
        mockMvc.perform(post("/api/auth/verify-login-otp")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                        "email": "%s",
                        "otp": "000000",
                        "role": "CLIENT"
                    }
                    """.formatted(TEST_EMAIL)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value(containsString("attempt(s) remaining")))
                .andExpect(jsonPath("$.token").doesNotExist());
    }

    // ── 7. Verify OTP for non-existent user ───────────────────────

    @Test
    @Order(7)
    @DisplayName("IT-07: Verify OTP for non-existent user returns error message")
    void verifyOtp_nonExistentUser_returnsError() throws Exception {
        mockMvc.perform(post("/api/auth/verify-login-otp")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                        "email": "ghost_nobody@talentflow.test",
                        "otp": "123456",
                        "role": "CLIENT"
                    }
                    """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").exists())
                .andExpect(jsonPath("$.token").doesNotExist());
    }

    // ── 8. Refresh with invalid token ─────────────────────────────

    @Test
    @Order(8)
    @DisplayName("IT-08: Refresh with invalid token returns error message")
    void refresh_invalidToken_returnsError() throws Exception {
        mockMvc.perform(post("/api/auth/refresh")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                        "refreshToken": "completely-invalid-refresh-token-xyz"
                    }
                    """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").exists())
                .andExpect(jsonPath("$.token").doesNotExist());
    }

    // ── 9. Protected endpoint without token → 401 ─────────────────

    @Test
    @Order(9)
    @DisplayName("IT-09: GET /api/user/profile without token returns 401")
    void profile_noToken_returns401() throws Exception {
        mockMvc.perform(get("/api/user/profile"))
                .andExpect(status().isUnauthorized());
    }

    // ── 10. Protected endpoint with invalid token → 401 ──────────

    @Test
    @Order(10)
    @DisplayName("IT-10: GET /api/user/profile with invalid token returns 401")
    void profile_invalidToken_returns401() throws Exception {
        mockMvc.perform(get("/api/user/profile")
                .header("Authorization", "Bearer invalid.jwt.token.here"))
                .andExpect(status().isUnauthorized());
    }

    // ── 11. Sensitive action without token → 401 ──────────────────

    @Test
    @Order(11)
    @DisplayName("IT-11: POST /api/sensitive/request-otp without token returns 401")
    void sensitiveOtp_noToken_returns401() throws Exception {
        mockMvc.perform(post("/api/sensitive/request-otp")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"action\":\"WITHDRAW\"}"))
                .andExpect(status().isUnauthorized());
    }

    // ── 12. Admin endpoint without token → 401 ────────────────────

    @Test
    @Order(12)
    @DisplayName("IT-12: GET /api/auth/users without token returns 401")
    void adminUsers_noToken_returns401() throws Exception {
        mockMvc.perform(get("/api/auth/users"))
                .andExpect(status().isUnauthorized());
    }

    // ── 13. Malformed JSON → 400 ──────────────────────────────────

    @Test
    @Order(13)
    @DisplayName("IT-13: Malformed JSON body returns 400")
    void malformedJson_returns400() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{not valid json}"))
                .andExpect(status().isBadRequest());
    }

    // ── 14. Missing required fields → 400 ────────────────────────

    @Test
    @Order(14)
    @DisplayName("IT-14: Register with missing fullName returns 400")
    void register_missingFullName_returns400() throws Exception {
        mockMvc.perform(post("/api/auth/register/client")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"test@test.com\",\"password\":\"Pass1234!\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").exists());
    }

    // ── 15. Admin registration with wrong code ────────────────────

    @Test
    @Order(15)
    @DisplayName("IT-15: Admin registration with wrong code returns 200 with error message")
    void adminRegister_wrongCode_returnsError() throws Exception {
        mockMvc.perform(post("/api/auth/register/admin")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                        "fullName": "Admin Test",
                        "email": "admin_it@talentflow.test",
                        "password": "AdminPass1!",
                        "adminCode": "WRONG-CODE",
                        "department": "security"
                    }
                    """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Invalid admin registration code."));
    }

    // ── 16. Login with wrong role ─────────────────────────────────

    @Test
    @Order(16)
    @DisplayName("IT-16: Login as ADMIN for a CLIENT-only email returns 'no account' message")
    void login_wrongRole_returnsNoAccountMessage() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                        "email": "%s",
                        "password": "%s",
                        "role": "ADMIN"
                    }
                    """.formatted(TEST_EMAIL, TEST_PASSWORD)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value(
                        "No ADMIN account found for this email. Please register first."));
    }

    // ── 17. Login with missing role ───────────────────────────────

    @Test
    @Order(17)
    @DisplayName("IT-17: Login without role field returns 'Role is required' message")
    void login_missingRole_returnsRoleRequired() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                        "email": "%s",
                        "password": "%s"
                    }
                    """.formatted(TEST_EMAIL, TEST_PASSWORD)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Role is required to log in."));
    }

    // ── 18. Refresh with missing refreshToken field → 400 ─────────

    @Test
    @Order(18)
    @DisplayName("IT-18: Refresh with missing refreshToken field returns 400")
    void refresh_missingField_returns400() throws Exception {
        mockMvc.perform(post("/api/auth/refresh")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
                .andExpect(status().isBadRequest());
    }
}
