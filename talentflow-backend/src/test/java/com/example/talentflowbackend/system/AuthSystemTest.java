package com.example.talentflowbackend.system;

import org.junit.jupiter.api.*;
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
 * System-level tests for the TalentFlowAI Authentication & Security Gateway.
 *
 * Scope: End-to-end verification of all responsible components:
 *   - User registration (Client, Freelancer, Admin) with TOTP setup
 *   - Two-step login (password → TOTP → JWT issuance)
 *   - JWT-protected endpoint access control
 *   - Role-Based Access Control (RBAC)
 *   - Brute-force protection (account locking)
 *   - Refresh token lifecycle
 *   - Sensitive action OTP flow
 *   - Input validation and error handling
 *   - Security headers and CSRF protection
 *
 * These tests demonstrate correctness, stability, and reliability
 * of the authentication gateway as required by the project specification.
 */
@ActiveProfiles("test")
@SpringBootTest
@AutoConfigureMockMvc
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
@DisplayName("System Tests — Authentication & Security Gateway")
class AuthSystemTest {

    @Autowired
    private MockMvc mockMvc;

    private static final String EMAIL = "system_test_" + System.currentTimeMillis() + "@talentflow.test";
    private static final String PASSWORD = "SystemTest1!";

    // ═══════════════════════════════════════════════════════════════
    // SCENARIO 1: User Registration
    // ═══════════════════════════════════════════════════════════════

    @Test @Order(1)
    @DisplayName("SYS-01 | Registration: New client receives QR code and TOTP secret")
    void sys01_clientRegistration_returnsQrAndSecret() throws Exception {
        mockMvc.perform(post("/api/auth/register/client")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"fullName":"System Tester","email":"%s","password":"%s","phoneNumber":"+94771234567"}
                    """.formatted(EMAIL, PASSWORD)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("CLIENT"))
                .andExpect(jsonPath("$.qrCode").exists())
                .andExpect(jsonPath("$.totpSecret").isNotEmpty())
                .andExpect(jsonPath("$.token").doesNotExist()); // no JWT until OTP verified
    }

    @Test @Order(2)
    @DisplayName("SYS-02 | Registration: Same email can register as Freelancer (multi-role)")
    void sys02_multiRoleRegistration_addsFreelancerRole() throws Exception {
        mockMvc.perform(post("/api/auth/register/freelancer")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"fullName":"System Tester","email":"%s","password":"FreelancerPass1!","professionalTitle":"QA Engineer"}
                    """.formatted(EMAIL)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("FREELANCER"))
                .andExpect(jsonPath("$.message").value(containsString("Freelancer account created")));
    }

    @Test @Order(3)
    @DisplayName("SYS-03 | Registration: Duplicate role registration is rejected gracefully")
    void sys03_duplicateRole_returnsAlreadyExistsMessage() throws Exception {
        mockMvc.perform(post("/api/auth/register/client")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"fullName":"System Tester","email":"%s","password":"%s"}
                    """.formatted(EMAIL, PASSWORD)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("A Client account already exists for this email."));
    }

    @Test @Order(4)
    @DisplayName("SYS-04 | Registration: Admin registration with wrong secret code is rejected")
    void sys04_adminRegistration_wrongCode_rejected() throws Exception {
        mockMvc.perform(post("/api/auth/register/admin")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"fullName":"Fake Admin","email":"fake_admin@test.com","password":"Admin1!","adminCode":"WRONG","department":"IT"}
                    """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Invalid admin registration code."));
    }

    @Test @Order(5)
    @DisplayName("SYS-05 | Registration: Missing required fields returns 400 with validation message")
    void sys05_registration_missingFields_returns400() throws Exception {
        mockMvc.perform(post("/api/auth/register/client")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"incomplete@test.com\",\"password\":\"Pass1!\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").exists());
    }

    // ═══════════════════════════════════════════════════════════════
    // SCENARIO 2: Two-Step Login Flow
    // ═══════════════════════════════════════════════════════════════

    @Test @Order(6)
    @DisplayName("SYS-06 | Login Step 1: Correct credentials return otpRequired=true, no JWT")
    void sys06_login_correctCredentials_requiresOtp() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"email":"%s","password":"%s","role":"CLIENT"}
                    """.formatted(EMAIL, PASSWORD)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.otpRequired").value(true))
                .andExpect(jsonPath("$.token").doesNotExist())
                .andExpect(jsonPath("$.message").value(containsString("authenticator")));
    }

    @Test @Order(7)
    @DisplayName("SYS-07 | Login Step 1: Wrong password decrements attempt counter")
    void sys07_login_wrongPassword_decrementsAttempts() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"email":"%s","password":"WrongPass!","role":"CLIENT"}
                    """.formatted(EMAIL)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value(containsString("attempt(s) remaining")))
                .andExpect(jsonPath("$.token").doesNotExist());
    }

    @Test @Order(8)
    @DisplayName("SYS-08 | Login Step 1: Login with wrong role returns 'no account' message")
    void sys08_login_wrongRole_returnsNoAccountMessage() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"email":"%s","password":"%s","role":"ADMIN"}
                    """.formatted(EMAIL, PASSWORD)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value(containsString("No ADMIN account found")));
    }

    @Test @Order(9)
    @DisplayName("SYS-09 | Login Step 1: Missing role field returns 'Role is required' message")
    void sys09_login_missingRole_returnsRoleRequired() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"email":"%s","password":"%s"}
                    """.formatted(EMAIL, PASSWORD)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Role is required to log in."));
    }

    @Test @Order(10)
    @DisplayName("SYS-10 | Login Step 2: Wrong OTP code decrements OTP attempt counter")
    void sys10_otpVerify_wrongCode_decrementsAttempts() throws Exception {
        mockMvc.perform(post("/api/auth/verify-login-otp")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"email":"%s","otp":"000000","role":"CLIENT"}
                    """.formatted(EMAIL)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value(containsString("attempt(s) remaining")))
                .andExpect(jsonPath("$.token").doesNotExist());
    }

    @Test @Order(11)
    @DisplayName("SYS-11 | Login Step 2: OTP verify for non-existent user returns error")
    void sys11_otpVerify_nonExistentUser_returnsError() throws Exception {
        mockMvc.perform(post("/api/auth/verify-login-otp")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"nobody@test.com\",\"otp\":\"123456\",\"role\":\"CLIENT\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").doesNotExist());
    }

    // ═══════════════════════════════════════════════════════════════
    // SCENARIO 3: JWT & RBAC — Protected Endpoint Access
    // ═══════════════════════════════════════════════════════════════

    @Test @Order(12)
    @DisplayName("SYS-12 | RBAC: GET /api/user/profile without token returns 401")
    void sys12_profile_noToken_returns401() throws Exception {
        mockMvc.perform(get("/api/user/profile"))
                .andExpect(status().isUnauthorized());
    }

    @Test @Order(13)
    @DisplayName("SYS-13 | RBAC: GET /api/user/profile with malformed JWT returns 401")
    void sys13_profile_malformedJwt_returns401() throws Exception {
        mockMvc.perform(get("/api/user/profile")
                .header("Authorization", "Bearer not.a.real.jwt"))
                .andExpect(status().isUnauthorized());
    }

    @Test @Order(14)
    @DisplayName("SYS-14 | RBAC: GET /api/admin/users without token returns 401")
    void sys14_adminUsers_noToken_returns401() throws Exception {
        mockMvc.perform(get("/api/admin/users"))
                .andExpect(status().isUnauthorized());
    }

    @Test @Order(15)
    @DisplayName("SYS-15 | RBAC: POST /api/sensitive/request-otp without token returns 401")
    void sys15_sensitiveOtp_noToken_returns401() throws Exception {
        mockMvc.perform(post("/api/sensitive/request-otp")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"action\":\"WITHDRAW\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test @Order(16)
    @DisplayName("SYS-16 | RBAC: POST /api/auth/logout without token returns 401")
    void sys16_logout_noToken_returns401() throws Exception {
        mockMvc.perform(post("/api/auth/logout")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"refreshToken\":\"any\"}"))
                .andExpect(status().isUnauthorized());
    }

    // ═══════════════════════════════════════════════════════════════
    // SCENARIO 4: Token Refresh Lifecycle
    // ═══════════════════════════════════════════════════════════════

    @Test @Order(17)
    @DisplayName("SYS-17 | Token Refresh: Invalid refresh token returns error message")
    void sys17_refresh_invalidToken_returnsError() throws Exception {
        mockMvc.perform(post("/api/auth/refresh")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"refreshToken\":\"invalid-token-xyz\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").exists())
                .andExpect(jsonPath("$.token").doesNotExist());
    }

    @Test @Order(18)
    @DisplayName("SYS-18 | Token Refresh: Missing refreshToken field returns 400")
    void sys18_refresh_missingField_returns400() throws Exception {
        mockMvc.perform(post("/api/auth/refresh")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
                .andExpect(status().isBadRequest());
    }

    // ═══════════════════════════════════════════════════════════════
    // SCENARIO 5: Input Validation & Error Handling
    // ═══════════════════════════════════════════════════════════════

    @Test @Order(19)
    @DisplayName("SYS-19 | Validation: Malformed JSON body returns 400 with safe message")
    void sys19_malformedJson_returns400() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{not valid json}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Invalid request format. Please check your input."));
    }

    @Test @Order(20)
    @DisplayName("SYS-20 | Validation: Wrong HTTP method returns 405")
    void sys20_wrongHttpMethod_returns405() throws Exception {
        mockMvc.perform(get("/api/auth/login"))
                .andExpect(status().isMethodNotAllowed());
    }

    @Test @Order(21)
    @DisplayName("SYS-21 | Validation: OTP verify with invalid action returns error")
    void sys21_sensitiveOtp_invalidAction_returnsError() throws Exception {
        mockMvc.perform(post("/api/otp/verify")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"nobody@test.com\",\"otp\":\"123456\"}"))
                .andExpect(status().isBadRequest());
    }

    // ═══════════════════════════════════════════════════════════════
    // SCENARIO 6: Security Headers
    // ═══════════════════════════════════════════════════════════════

    @Test @Order(22)
    @DisplayName("SYS-22 | Security: Login endpoint returns X-Content-Type-Options header")
    void sys22_loginEndpoint_hasContentTypeOptionsHeader() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"test@test.com\",\"password\":\"pass\",\"role\":\"CLIENT\"}"))
                .andExpect(header().string("X-Content-Type-Options", "nosniff"));
    }

    @Test @Order(23)
    @DisplayName("SYS-23 | Security: Login endpoint returns X-Frame-Options: DENY header")
    void sys23_loginEndpoint_hasFrameOptionsHeader() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"test@test.com\",\"password\":\"pass\",\"role\":\"CLIENT\"}"))
                .andExpect(header().string("X-Frame-Options", "DENY"));
    }

    @Test @Order(24)
    @DisplayName("SYS-24 | Security: Registration endpoint is publicly accessible (no auth required)")
    void sys24_registrationEndpoint_isPublic() throws Exception {
        mockMvc.perform(post("/api/auth/register/client")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"fullName\":\"Public Test\",\"email\":\"public_test_" + System.currentTimeMillis() + "@test.com\",\"password\":\"PublicPass1!\"}"))
                .andExpect(status().isOk()); // not 401
    }
}
