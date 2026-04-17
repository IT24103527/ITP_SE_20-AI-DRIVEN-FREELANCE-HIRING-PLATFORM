package com.example.talentflowbackend.volume;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import com.example.talentflowbackend.service.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Volume tests for REST API endpoints.
 *
 * Verifies the system handles large volumes of HTTP requests correctly:
 * - 200 sequential login requests — none return 5xx
 * - 100 sequential registration requests — none return 5xx
 * - 500 sequential 401 requests — all return 401
 * - 100 sequential refresh requests — none return 5xx
 * - Large request body — handled gracefully
 */
@Tag("volume")
@ActiveProfiles("test")
@SpringBootTest
@AutoConfigureMockMvc
class ApiVolumeTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private EmailService emailService;

    private static final long TS = System.currentTimeMillis();

    // ── VOL-API-01: 200 sequential login requests — no 5xx ────────

    @Test
    @DisplayName("VOL-API-01: 200 sequential login requests — none return 5xx")
    void login200Sequential_no5xx() throws Exception {
        int serverErrors = 0;
        for (int i = 0; i < 200; i++) {
            MvcResult result = mockMvc.perform(post("/api/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"email\":\"vol" + i + "@test.com\",\"password\":\"pass\",\"role\":\"CLIENT\"}"))
                    .andReturn();
            if (result.getResponse().getStatus() >= 500) serverErrors++;
        }
        assertEquals(0, serverErrors, serverErrors + " of 200 login requests returned 5xx");
        System.out.printf("[VOL] 200 sequential login requests: 0 server errors%n");
    }

    // ── VOL-API-02: 100 sequential registrations — no 5xx ─────────

    @Test
    @DisplayName("VOL-API-02: 100 sequential client registrations — none return 5xx")
    void register100Sequential_no5xx() throws Exception {
        int serverErrors = 0;
        for (int i = 0; i < 100; i++) {
            MvcResult result = mockMvc.perform(post("/api/auth/register/client")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("""
                        {
                            "fullName": "Vol User %d",
                            "email": "vol_reg_%d_%d@talentflow.test",
                            "password": "VolPass1!"
                        }
                        """.formatted(i, TS, i)))
                    .andReturn();
            if (result.getResponse().getStatus() >= 500) serverErrors++;
        }
        assertEquals(0, serverErrors, serverErrors + " of 100 registrations returned 5xx");
        System.out.printf("[VOL] 100 sequential registrations: 0 server errors%n");
    }

    // ── VOL-API-03: 500 sequential 401 requests — all 401 ─────────

    @Test
    @DisplayName("VOL-API-03: 500 sequential unauthenticated requests — all return 401")
    void get500Unauthorized_all401() throws Exception {
        int wrong = 0;
        for (int i = 0; i < 500; i++) {
            MvcResult result = mockMvc.perform(get("/api/user/profile")).andReturn();
            if (result.getResponse().getStatus() != 401) wrong++;
        }
        assertEquals(0, wrong, wrong + " of 500 requests did not return 401");
        System.out.printf("[VOL] 500 unauthenticated requests: all returned 401%n");
    }

    // ── VOL-API-04: 100 sequential refresh requests — no 5xx ──────

    @Test
    @DisplayName("VOL-API-04: 100 sequential refresh requests with invalid tokens — none return 5xx")
    void refresh100Sequential_no5xx() throws Exception {
        int serverErrors = 0;
        for (int i = 0; i < 100; i++) {
            MvcResult result = mockMvc.perform(post("/api/auth/refresh")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"refreshToken\":\"vol-invalid-token-" + i + "\"}"))
                    .andReturn();
            if (result.getResponse().getStatus() >= 500) serverErrors++;
        }
        assertEquals(0, serverErrors, serverErrors + " of 100 refresh requests returned 5xx");
        System.out.printf("[VOL] 100 sequential refresh requests: 0 server errors%n");
    }

    // ── VOL-API-05: 50 registrations across all 3 roles ──────────

    @Test
    @DisplayName("VOL-API-05: 50 registrations across all 3 roles — none return 5xx")
    void register50AllRoles_no5xx() throws Exception {
        int serverErrors = 0;
        for (int i = 0; i < 50; i++) {
            String role = switch (i % 3) {
                case 0 -> "client";
                case 1 -> "freelancer";
                default -> "admin";
            };
            String body = switch (role) {
                case "admin" -> """
                    {"fullName":"Vol Admin %d","email":"vol_admin_%d_%d@talentflow.test","password":"AdminPass1!","adminCode":"WRONG","department":"IT"}
                    """.formatted(i, TS, i);
                default -> """
                    {"fullName":"Vol User %d","email":"vol_%s_%d_%d@talentflow.test","password":"Pass1!"}
                    """.formatted(i, role, TS, i);
            };

            MvcResult result = mockMvc.perform(post("/api/auth/register/" + role)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(body))
                    .andReturn();
            if (result.getResponse().getStatus() >= 500) serverErrors++;
        }
        assertEquals(0, serverErrors, serverErrors + " of 50 multi-role registrations returned 5xx");
        System.out.printf("[VOL] 50 registrations (all roles): 0 server errors%n");
    }

    // ── VOL-API-06: Very long email — handled gracefully ──────────

    @Test
    @DisplayName("VOL-API-06: Login with 500-character email — returns 200 or 400, not 5xx")
    void login_veryLongEmail_handledGracefully() throws Exception {
        String longEmail = "a".repeat(490) + "@test.com";
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"" + longEmail + "\",\"password\":\"pass\",\"role\":\"CLIENT\"}"))
                .andReturn();
        int status = result.getResponse().getStatus();
        assertTrue(status < 500, "Long email caused 5xx: " + status);
        System.out.printf("[VOL] 500-char email login: status=%d (not 5xx)%n", status);
    }

    // ── VOL-API-07: 200 OTP verifications — no 5xx ────────────────

    @Test
    @DisplayName("VOL-API-07: 200 sequential OTP verifications for non-existent users — none return 5xx")
    void verifyOtp200Sequential_no5xx() throws Exception {
        int serverErrors = 0;
        for (int i = 0; i < 200; i++) {
            MvcResult result = mockMvc.perform(post("/api/auth/verify-login-otp")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"email\":\"vol_otp_" + i + "@test.com\",\"otp\":\"123456\",\"role\":\"CLIENT\"}"))
                    .andReturn();
            if (result.getResponse().getStatus() >= 500) serverErrors++;
        }
        assertEquals(0, serverErrors, serverErrors + " of 200 OTP verifications returned 5xx");
        System.out.printf("[VOL] 200 sequential OTP verifications: 0 server errors%n");
    }

    // ── VOL-API-08: Response bodies never null ────────────────────

    @Test
    @DisplayName("VOL-API-08: 100 login requests — all response bodies are non-empty JSON")
    void login100_allResponseBodiesNonEmpty() throws Exception {
        int emptyBodies = 0;
        for (int i = 0; i < 100; i++) {
            MvcResult result = mockMvc.perform(post("/api/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"email\":\"body" + i + "@test.com\",\"password\":\"pass\",\"role\":\"CLIENT\"}"))
                    .andReturn();
            String body = result.getResponse().getContentAsString();
            if (body == null || body.isBlank() || !body.contains("message")) emptyBodies++;
        }
        assertEquals(0, emptyBodies, emptyBodies + " of 100 responses had empty/invalid body");
        System.out.printf("[VOL] 100 login responses: all contain 'message' field%n");
    }
}
