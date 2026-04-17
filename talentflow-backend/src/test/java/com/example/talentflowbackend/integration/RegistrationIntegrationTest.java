package com.example.talentflowbackend.integration;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests for all three registration flows.
 */
@ActiveProfiles("test")
@SpringBootTest
@AutoConfigureMockMvc
class RegistrationIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    private static final long TS = System.currentTimeMillis();

    // ── Client registration ───────────────────────────────────────

    @Test
    @DisplayName("REG-01: New client registration returns qrCode, totpSecret, role=CLIENT")
    void clientRegistration_newEmail_success() throws Exception {
        mockMvc.perform(post("/api/auth/register/client")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                        "fullName": "New Client",
                        "email": "reg_client_%d@talentflow.test",
                        "password": "ClientPass1!"
                    }
                    """.formatted(TS)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.qrCode").value(startsWith("data:image/")))
                .andExpect(jsonPath("$.totpSecret").isNotEmpty())
                .andExpect(jsonPath("$.role").value("CLIENT"));
    }

    @Test
    @DisplayName("REG-02: Client registration with blank fullName returns 400")
    void clientRegistration_blankFullName_returns400() throws Exception {
        mockMvc.perform(post("/api/auth/register/client")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                        "fullName": "",
                        "email": "test@test.com",
                        "password": "Pass1234!"
                    }
                    """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").exists());
    }

    @Test
    @DisplayName("REG-03: Client registration with blank password returns 400")
    void clientRegistration_blankPassword_returns400() throws Exception {
        mockMvc.perform(post("/api/auth/register/client")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                        "fullName": "Test",
                        "email": "test@test.com",
                        "password": ""
                    }
                    """))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("REG-04: Client registration with blank email returns 400")
    void clientRegistration_blankEmail_returns400() throws Exception {
        mockMvc.perform(post("/api/auth/register/client")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                        "fullName": "Test",
                        "email": "",
                        "password": "Pass1234!"
                    }
                    """))
                .andExpect(status().isBadRequest());
    }

    // ── Freelancer registration ───────────────────────────────────

    @Test
    @DisplayName("REG-05: New freelancer registration returns qrCode and role=FREELANCER")
    void freelancerRegistration_newEmail_success() throws Exception {
        mockMvc.perform(post("/api/auth/register/freelancer")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                        "fullName": "New Freelancer",
                        "email": "reg_fl_%d@talentflow.test",
                        "password": "FreelancerPass1!",
                        "professionalTitle": "Full Stack Developer",
                        "skills": "Java, React"
                    }
                    """.formatted(TS + 1)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.qrCode").exists())
                .andExpect(jsonPath("$.role").value("FREELANCER"));
    }

    @Test
    @DisplayName("REG-06: Freelancer registration with missing required fields returns 400")
    void freelancerRegistration_missingFields_returns400() throws Exception {
        mockMvc.perform(post("/api/auth/register/freelancer")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"fl@test.com\"}"))
                .andExpect(status().isBadRequest());
    }

    // ── Admin registration ────────────────────────────────────────

    @Test
    @DisplayName("REG-07: Admin registration with wrong code returns 200 with error")
    void adminRegistration_wrongCode_returnsError() throws Exception {
        mockMvc.perform(post("/api/auth/register/admin")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                        "fullName": "Admin",
                        "email": "admin_reg_%d@talentflow.test",
                        "password": "AdminPass1!",
                        "adminCode": "WRONG-CODE",
                        "department": "security"
                    }
                    """.formatted(TS + 2)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Invalid admin registration code."));
    }

    @Test
    @DisplayName("REG-08: Admin registration with missing adminCode returns 400")
    void adminRegistration_missingAdminCode_returns400() throws Exception {
        mockMvc.perform(post("/api/auth/register/admin")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                        "fullName": "Admin",
                        "email": "admin@test.com",
                        "password": "AdminPass1!",
                        "department": "security"
                    }
                    """))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("REG-09: Admin registration with missing department returns 400")
    void adminRegistration_missingDepartment_returns400() throws Exception {
        mockMvc.perform(post("/api/auth/register/admin")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                        "fullName": "Admin",
                        "email": "admin@test.com",
                        "password": "AdminPass1!",
                        "adminCode": "123456789"
                    }
                    """))
                .andExpect(status().isBadRequest());
    }

    // ── Multi-role registration ───────────────────────────────────

    @Test
    @DisplayName("REG-10: Register client then freelancer with same email — both succeed")
    void multiRole_clientThenFreelancer_bothSucceed() throws Exception {
        String email = "multi_reg_%d@talentflow.test".formatted(TS + 3);

        // Register as client
        mockMvc.perform(post("/api/auth/register/client")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"fullName":"Multi","email":"%s","password":"ClientPass1!"}
                    """.formatted(email)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("CLIENT"));

        // Register same email as freelancer
        mockMvc.perform(post("/api/auth/register/freelancer")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"fullName":"Multi","email":"%s","password":"FreelancerPass1!"}
                    """.formatted(email)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value(containsString("Freelancer account created")));
    }

    @Test
    @DisplayName("REG-11: Register same role twice returns 'already exists' message")
    void sameRole_twice_returnsAlreadyExists() throws Exception {
        String email = "dup_reg_%d@talentflow.test".formatted(TS + 4);
        String body = """
                {"fullName":"Dup","email":"%s","password":"Pass1234!"}
                """.formatted(email);

        mockMvc.perform(post("/api/auth/register/client")
                .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/auth/register/client")
                .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("A Client account already exists for this email."));
    }

    // ── Response structure ────────────────────────────────────────

    @Test
    @DisplayName("REG-12: Successful registration response never contains password fields")
    void registration_responseNeverContainsPassword() throws Exception {
        mockMvc.perform(post("/api/auth/register/client")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                        "fullName": "Safe User",
                        "email": "safe_reg_%d@talentflow.test",
                        "password": "SafePass1!"
                    }
                    """.formatted(TS + 5)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.clientPassword").doesNotExist())
                .andExpect(jsonPath("$.freelancerPassword").doesNotExist())
                .andExpect(jsonPath("$.adminPassword").doesNotExist())
                .andExpect(jsonPath("$.totpSecret").exists()); // QR setup secret is intentionally returned
    }
}
