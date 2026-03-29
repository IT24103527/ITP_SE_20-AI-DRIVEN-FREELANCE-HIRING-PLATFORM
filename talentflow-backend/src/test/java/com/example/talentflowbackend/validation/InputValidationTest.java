package com.example.talentflowbackend.validation;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests for input validation and edge-case handling.
 *
 * Verifies that the API:
 * - Returns clean error messages (not stack traces) for invalid input
 * - Handles missing fields, wrong credentials, and malformed JSON gracefully
 * - Enforces per-role registration and login rules
 */
@SpringBootTest
@AutoConfigureMockMvc
class InputValidationTest {

    @Autowired
    private MockMvc mockMvc;

    // ── Login validation ──────────────────────────────────────────

    @Test
    @DisplayName("Login with empty body returns 200 with a message (not 500)")
    void login_emptyBody_returnsMessage() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").exists());
    }

    @Test
    @DisplayName("Login with non-existent email returns 'Invalid email or password'")
    void login_nonExistentEmail_returnsInvalidMessage() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"ghost@nowhere.com\",\"password\":\"Password1\",\"role\":\"CLIENT\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Invalid email or password."))
                .andExpect(jsonPath("$.token").doesNotExist());
    }

    @Test
    @DisplayName("Login without role field returns 'Role is required' message")
    void login_missingRole_returnsRoleRequiredMessage() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"test@test.com\",\"password\":\"Password1\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Role is required to log in."));
    }

    @Test
    @DisplayName("Login with malformed JSON returns 400")
    void login_malformedJson_returns400() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{not valid json}"))
                .andExpect(status().isBadRequest());
    }

    // ── OTP verification validation ───────────────────────────────

    @Test
    @DisplayName("Verify OTP with non-existent email returns error message without token")
    void verifyOtp_nonExistentEmail_returnsError() throws Exception {
        mockMvc.perform(post("/api/auth/verify-login-otp")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"ghost@nowhere.com\",\"otp\":\"123456\",\"role\":\"CLIENT\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").exists())
                .andExpect(jsonPath("$.token").doesNotExist());
    }

    @Test
    @DisplayName("Verify OTP with empty body returns message (not 500)")
    void verifyOtp_emptyBody_returnsMessage() throws Exception {
        mockMvc.perform(post("/api/auth/verify-login-otp")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").exists());
    }

    // ── Client registration validation ────────────────────────────

    @Test
    @DisplayName("Register client with missing required fields returns 400 with message")
    void registerClient_missingFields_returns400() throws Exception {
        mockMvc.perform(post("/api/auth/register/client")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"test@test.com\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").exists());
    }

    @Test
    @DisplayName("Register client twice with same email returns 'already exists' message")
    void registerClient_duplicateEmail_returnsAlreadyExistsMessage() throws Exception {
        String body = """
            {
                "fullName": "Dup User",
                "email": "duptest_client@talentflow.test",
                "password": "Password1"
            }
            """;
        // First registration — should succeed
        mockMvc.perform(post("/api/auth/register/client")
                .contentType(MediaType.APPLICATION_JSON)
                .content(body))
                .andExpect(status().isOk());

        // Second registration — same email, same role
        mockMvc.perform(post("/api/auth/register/client")
                .contentType(MediaType.APPLICATION_JSON)
                .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("A Client account already exists for this email."));
    }

    @Test
    @DisplayName("Register client then freelancer with same email adds freelancer role")
    void registerClientThenFreelancer_sameEmail_addsFreelancerRole() throws Exception {
        String email = "multirole_test@talentflow.test";

        mockMvc.perform(post("/api/auth/register/client")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"fullName\":\"Multi\",\"email\":\"" + email + "\",\"password\":\"Password1\"}"))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/auth/register/freelancer")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"fullName\":\"Multi\",\"email\":\"" + email + "\",\"password\":\"FreelancerPass1\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value(
                        "Freelancer account created! Use your new Freelancer password + authenticator app to log in."));
    }

    // ── Admin registration validation ─────────────────────────────

    @Test
    @DisplayName("Register admin with wrong admin code returns 'Invalid admin registration code'")
    void registerAdmin_wrongCode_returnsInvalidCodeMessage() throws Exception {
        mockMvc.perform(post("/api/auth/register/admin")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"fullName\":\"Admin\",\"email\":\"admin@test.com\",\"password\":\"Password1\",\"adminCode\":\"WRONG\",\"department\":\"IT\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Invalid admin registration code."));
    }

    @Test
    @DisplayName("Register admin with missing adminCode field returns 400")
    void registerAdmin_missingAdminCode_returns400() throws Exception {
        mockMvc.perform(post("/api/auth/register/admin")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"fullName\":\"Admin\",\"email\":\"admin@test.com\",\"password\":\"Password1\",\"department\":\"IT\"}"))
                .andExpect(status().isBadRequest());
    }

    // ── Freelancer registration validation ────────────────────────

    @Test
    @DisplayName("Register freelancer with missing required fields returns 400")
    void registerFreelancer_missingFields_returns400() throws Exception {
        mockMvc.perform(post("/api/auth/register/freelancer")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"freelancer@test.com\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").exists());
    }

    // ── Role-specific login validation ────────────────────────────

    @Test
    @DisplayName("Login as CLIENT role for an email that only has FREELANCER returns 'no account' message")
    void login_wrongRoleForEmail_returnsNoAccountMessage() throws Exception {
        // Register as freelancer only
        String email = "freelancer_only@talentflow.test";
        mockMvc.perform(post("/api/auth/register/freelancer")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"fullName\":\"FL Only\",\"email\":\"" + email + "\",\"password\":\"Password1\"}"))
                .andExpect(status().isOk());

        // Try to log in as CLIENT — should fail with clear message
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"" + email + "\",\"password\":\"Password1\",\"role\":\"CLIENT\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value(
                        "No CLIENT account found for this email. Please register first."));
    }
}
