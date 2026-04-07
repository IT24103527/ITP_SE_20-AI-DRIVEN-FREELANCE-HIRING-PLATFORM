package com.example.talentflowbackend.exception;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for GlobalExceptionHandler.
 * Verifies that no internal details are leaked to clients.
 */
class GlobalExceptionHandlerTest {

    private GlobalExceptionHandler handler;

    @BeforeEach
    void setUp() {
        handler = new GlobalExceptionHandler();
    }

    // ── Validation errors ─────────────────────────────────────────

    @Test
    @DisplayName("Validation error returns 400 with field message")
    void validationError_returns400WithMessage() {
        BindingResult bindingResult = mock(BindingResult.class);
        FieldError fieldError = new FieldError("obj", "email", "Email is required");
        when(bindingResult.getFieldErrors()).thenReturn(List.of(fieldError));

        MethodArgumentNotValidException ex = mock(MethodArgumentNotValidException.class);
        when(ex.getBindingResult()).thenReturn(bindingResult);

        ResponseEntity<Map<String, Object>> response = handler.handleValidationErrors(ex);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("Email is required", response.getBody().get("message"));
    }

    @Test
    @DisplayName("Validation error includes errors map")
    void validationError_includesErrorsMap() {
        BindingResult bindingResult = mock(BindingResult.class);
        FieldError fieldError = new FieldError("obj", "password", "Password is required");
        when(bindingResult.getFieldErrors()).thenReturn(List.of(fieldError));

        MethodArgumentNotValidException ex = mock(MethodArgumentNotValidException.class);
        when(ex.getBindingResult()).thenReturn(bindingResult);

        ResponseEntity<Map<String, Object>> response = handler.handleValidationErrors(ex);

        @SuppressWarnings("unchecked")
        Map<String, String> errors = (Map<String, String>) response.getBody().get("errors");
        assertNotNull(errors);
        assertEquals("Password is required", errors.get("password"));
    }

    // ── Malformed JSON ────────────────────────────────────────────

    @Test
    @DisplayName("Malformed JSON returns 400 with safe message")
    void malformedJson_returns400SafeMessage() {
        HttpMessageNotReadableException ex = mock(HttpMessageNotReadableException.class);
        ResponseEntity<Map<String, String>> response = handler.handleMalformedJson(ex);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertEquals("Invalid request format. Please check your input.",
                response.getBody().get("message"));
    }

    // ── Authentication failure ────────────────────────────────────

    @Test
    @DisplayName("AuthenticationException returns 401 with safe message")
    void authException_returns401() {
        AuthenticationException ex = mock(AuthenticationException.class);
        when(ex.getMessage()).thenReturn("Bad credentials — internal detail");

        ResponseEntity<Map<String, String>> response = handler.handleAuthException(ex);

        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
        // Must NOT echo the internal message
        assertNotEquals("Bad credentials — internal detail", response.getBody().get("message"));
        assertEquals("Authentication failed. Please check your credentials.",
                response.getBody().get("message"));
    }

    // ── Access denied ─────────────────────────────────────────────

    @Test
    @DisplayName("AccessDeniedException returns 403 with safe message")
    void accessDenied_returns403() {
        AccessDeniedException ex = new AccessDeniedException("Access is denied");
        ResponseEntity<Map<String, String>> response = handler.handleAccessDenied(ex);

        assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
        assertEquals("You do not have permission to perform this action.",
                response.getBody().get("message"));
    }

    // ── Missing parameter ─────────────────────────────────────────

    @Test
    @DisplayName("Missing parameter returns 400 with parameter name")
    void missingParam_returns400WithParamName() {
        MissingServletRequestParameterException ex =
                new MissingServletRequestParameterException("role", "String");

        ResponseEntity<Map<String, String>> response = handler.handleMissingParam(ex);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertTrue(response.getBody().get("message").contains("role"));
    }

    // ── Illegal argument ──────────────────────────────────────────

    @Test
    @DisplayName("IllegalArgumentException returns 400 with message")
    void illegalArgument_returns400() {
        IllegalArgumentException ex = new IllegalArgumentException("Invalid action: HACK");
        ResponseEntity<Map<String, String>> response = handler.handleIllegalArgument(ex);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertEquals("Invalid action: HACK", response.getBody().get("message"));
    }

    // ── Runtime exception — no internal leakage ───────────────────

    @Test
    @DisplayName("RuntimeException with stack trace text returns generic message")
    void runtimeException_withStackTrace_returnsGenericMessage() {
        RuntimeException ex = new RuntimeException(
                "NullPointerException at com.example.Service.java:42");

        ResponseEntity<Map<String, String>> response = handler.handleRuntimeException(ex);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        // Must not expose the class name or line number
        assertFalse(response.getBody().get("message").contains("NullPointerException"));
        assertFalse(response.getBody().get("message").contains("java:42"));
    }

    @Test
    @DisplayName("RuntimeException with safe short message passes it through")
    void runtimeException_safeMessage_passesThrough() {
        RuntimeException ex = new RuntimeException("User not found");
        ResponseEntity<Map<String, String>> response = handler.handleRuntimeException(ex);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertEquals("User not found", response.getBody().get("message"));
    }

    // ── Generic catch-all ─────────────────────────────────────────

    @Test
    @DisplayName("Generic Exception returns 500 with safe message")
    void genericException_returns500() throws Exception {
        Exception ex = new Exception("Database connection pool exhausted at line 99");
        ResponseEntity<Map<String, String>> response = handler.handleGenericException(ex);

        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
        assertEquals("An internal error occurred. Please try again later.",
                response.getBody().get("message"));
    }

    @Test
    @DisplayName("Generic Exception never exposes stack trace in response")
    void genericException_noStackTrace() throws Exception {
        Exception ex = new Exception("java.sql.SQLException: ORA-00942");
        ResponseEntity<Map<String, String>> response = handler.handleGenericException(ex);

        String msg = response.getBody().get("message");
        assertFalse(msg.contains("SQLException"));
        assertFalse(msg.contains("ORA-"));
    }
}
