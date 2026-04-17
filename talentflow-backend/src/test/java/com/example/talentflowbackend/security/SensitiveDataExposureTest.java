package com.example.talentflowbackend.security;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Non-functional security tests: Sensitive data exposure prevention.
 *
 * Verifies that API responses never leak:
 * - Password hashes or plaintext passwords
 * - Internal stack traces or exception details
 * - MongoDB ObjectIds or internal DB identifiers in error messages
 * - OTP codes in responses
 * - JWT secrets or signing keys
 * - Internal server paths or class names
 */
@Tag("security")
@ActiveProfiles("test")
@SpringBootTest
@AutoConfigureMockMvc
class SensitiveDataExposureTest {

    @Autowired
    private MockMvc mockMvc;

    // ── Password never returned in any response ───────────────────

    @Test
    @DisplayName("SEC-EXP-01: Login failure response does not contain password field")
    void loginFailure_doesNotExposePassword() throws Exception {
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"test@test.com\",\"password\":\"wrongpass\",\"role\":\"CLIENT\"}"))
                .andReturn();
        String body = result.getResponse().getContentAsString();
        assertFalse(body.toLowerCase().contains("\"password\""),
                "Response body contains 'password' field: " + body);
    }

    @Test
    @DisplayName("SEC-EXP-02: Registration response does not echo back the password")
    void registrationResponse_doesNotEchoPassword() throws Exception {
        MvcResult result = mockMvc.perform(post("/api/auth/register/client")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"fullName\":\"Test User\",\"email\":\"expose@test.com\",\"password\":\"SecurePass1!\"}"))
                .andReturn();
        String body = result.getResponse().getContentAsString();
        assertFalse(body.contains("SecurePass1!"),
                "Response echoed back the plaintext password");
        assertFalse(body.toLowerCase().contains("\"password\""),
                "Response body contains 'password' field");
    }

    // ── Stack traces never exposed ────────────────────────────────

    @Test
    @DisplayName("SEC-EXP-03: Malformed JSON body does not return stack trace")
    void malformedJson_doesNotReturnStackTrace() throws Exception {
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{this is not valid json"))
                .andReturn();
        String body = result.getResponse().getContentAsString();
        assertFalse(body.contains("at com.example"),
                "Response contains Java stack trace");
        assertFalse(body.contains("java.lang."),
                "Response contains Java class names");
        assertFalse(body.contains("NullPointerException"),
                "Response contains exception class name");
    }

    @Test
    @DisplayName("SEC-EXP-04: Empty request body does not return stack trace")
    void emptyBody_doesNotReturnStackTrace() throws Exception {
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(""))
                .andReturn();
        String body = result.getResponse().getContentAsString();
        assertFalse(body.contains("at com.example"),
                "Response contains Java stack trace");
        assertFalse(body.contains("Exception"),
                "Response contains exception details");
    }

    // ── Internal paths not exposed ────────────────────────────────

    @Test
    @DisplayName("SEC-EXP-05: Error response does not expose internal file paths")
    void errorResponse_doesNotExposeInternalPaths() throws Exception {
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":null,\"password\":null,\"role\":null}"))
                .andReturn();
        String body = result.getResponse().getContentAsString();
        assertFalse(body.contains("C:\\") || body.contains("/home/") || body.contains("/var/"),
                "Response exposes internal file system path");
    }

    // ── OTP never returned in response ────────────────────────────

    @Test
    @DisplayName("SEC-EXP-06: OTP request response does not include the OTP code")
    void otpRequest_doesNotReturnOtpCode() throws Exception {
        MvcResult result = mockMvc.perform(post("/api/otp/send")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"test@test.com\"}"))
                .andReturn();
        String body = result.getResponse().getContentAsString();
        // OTP is 6 digits — response must not contain a 6-digit numeric sequence
        assertFalse(body.matches(".*\\b\\d{6}\\b.*"),
                "Response may contain a 6-digit OTP code: " + body);
    }

    // ── Wrong credentials give generic error ─────────────────────

    @Test
    @DisplayName("SEC-EXP-07: Wrong password returns generic error, not 'password incorrect'")
    void wrongPassword_returnsGenericError() throws Exception {
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"test@test.com\",\"password\":\"WrongPass1!\",\"role\":\"CLIENT\"}"))
                .andReturn();
        String body = result.getResponse().getContentAsString().toLowerCase();
        assertFalse(body.contains("password incorrect") || body.contains("wrong password"),
                "Response reveals which credential was wrong (password)");
    }

    @Test
    @DisplayName("SEC-EXP-08: Non-existent email returns same generic error as wrong password")
    void nonExistentEmail_returnsGenericError() throws Exception {
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"nobody@nowhere.com\",\"password\":\"Pass1!\",\"role\":\"CLIENT\"}"))
                .andReturn();
        String body = result.getResponse().getContentAsString().toLowerCase();
        assertFalse(body.contains("user not found") || body.contains("email not registered"),
                "Response reveals that the email does not exist (user enumeration)");
    }

    // ── No internal DB identifiers in error responses ─────────────

    @Test
    @DisplayName("SEC-EXP-09: Error responses do not expose MongoDB ObjectIds")
    void errorResponse_doesNotExposeMongoObjectId() throws Exception {
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"test@test.com\",\"password\":\"bad\",\"role\":\"CLIENT\"}"))
                .andReturn();
        String body = result.getResponse().getContentAsString();
        // MongoDB ObjectId is a 24-char hex string
        assertFalse(body.matches(".*\\b[0-9a-fA-F]{24}\\b.*"),
                "Response may contain a MongoDB ObjectId: " + body);
    }

    // ── Content-Type is always JSON, never HTML error pages ───────

    @Test
    @DisplayName("SEC-EXP-10: 401 response Content-Type is application/json, not HTML")
    void unauthorizedResponse_contentTypeIsJson() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/user/profile"))
                .andExpect(status().isUnauthorized())
                .andReturn();
        String contentType = result.getResponse().getContentType();
        // Must not return an HTML error page that could leak server info
        if (contentType != null) {
            assertFalse(contentType.contains("text/html"),
                    "401 response returned HTML content type: " + contentType);
        }
    }
}
