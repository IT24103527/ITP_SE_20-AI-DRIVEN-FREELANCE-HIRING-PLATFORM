package com.example.talentflowbackend.exception;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.util.HashMap;
import java.util.Map;

/**
 * Centralised exception handler.
 * NEVER exposes stack traces, internal class names, or database details to clients.
 * All unexpected errors are logged server-side and return a generic safe message.
 */
@ControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    // ── Validation failures (@Valid) ──────────────────────────────

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationErrors(MethodArgumentNotValidException ex) {
        Map<String, String> fieldErrors = new HashMap<>();
        for (FieldError fe : ex.getBindingResult().getFieldErrors()) {
            fieldErrors.put(fe.getField(), fe.getDefaultMessage());
        }
        String firstMessage = fieldErrors.values().iterator().next();
        return ResponseEntity.badRequest().body(Map.of(
            "message", firstMessage,
            "errors",  fieldErrors
        ));
    }

    // ── Malformed JSON ────────────────────────────────────────────

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, String>> handleMalformedJson(HttpMessageNotReadableException ex) {
        return ResponseEntity.badRequest().body(Map.of(
            "message", "Invalid request format. Please check your input."
        ));
    }

    // ── Missing request parameter ─────────────────────────────────

    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<Map<String, String>> handleMissingParam(MissingServletRequestParameterException ex) {
        return ResponseEntity.badRequest().body(Map.of(
            "message", "Required parameter '" + ex.getParameterName() + "' is missing."
        ));
    }

    // ── Type mismatch in path/query params ────────────────────────

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<Map<String, String>> handleTypeMismatch(MethodArgumentTypeMismatchException ex) {
        return ResponseEntity.badRequest().body(Map.of(
            "message", "Invalid value for parameter '" + ex.getName() + "'."
        ));
    }

    // ── Wrong HTTP method (e.g. GET on POST-only endpoint) ────────

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<Map<String, String>> handleMethodNotSupported(HttpRequestMethodNotSupportedException ex) {
        HttpHeaders headers = new HttpHeaders();
        if (ex.getSupportedHttpMethods() != null && !ex.getSupportedHttpMethods().isEmpty()) {
            headers.setAllow(ex.getSupportedHttpMethods());
        }
        return new ResponseEntity<>(Map.of(
                "message", "HTTP method not supported for this endpoint."
        ), headers, HttpStatus.METHOD_NOT_ALLOWED);
    }

    // ── Authentication failure ────────────────────────────────────

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<Map<String, String>> handleAuthException(AuthenticationException ex) {
        // Do NOT echo the exception message — it may contain internal details
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
            "message", "Authentication failed. Please check your credentials."
        ));
    }

    // ── Access denied (wrong role) ────────────────────────────────

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Map<String, String>> handleAccessDenied(AccessDeniedException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
            "message", "You do not have permission to perform this action."
        ));
    }

    // ── Illegal argument (e.g. invalid action in SensitiveActionOtpService) ──

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleIllegalArgument(IllegalArgumentException ex) {
        return ResponseEntity.badRequest().body(Map.of(
            "message", ex.getMessage() != null ? ex.getMessage() : "Invalid request parameter."
        ));
    }

    // ── Known runtime exceptions ──────────────────────────────────

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, String>> handleRuntimeException(RuntimeException ex) {
        // Log full details server-side, return safe message to client
        log.error("Runtime exception: {}", ex.getMessage(), ex);
        String msg = ex.getMessage();
        // Only pass through safe, user-facing messages (no class names, no SQL, no stack)
        if (msg != null && msg.length() < 200 && !msg.contains("Exception") && !msg.contains("at ")) {
            return ResponseEntity.badRequest().body(Map.of("message", msg));
        }
        return ResponseEntity.badRequest().body(Map.of(
            "message", "An error occurred. Please try again."
        ));
    }

    // ── Catch-all — NEVER leak internals ─────────────────────────

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, String>> handleGenericException(Exception ex) {
        log.error("Unhandled exception: {}", ex.getMessage(), ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
            "message", "An internal error occurred. Please try again later."
        ));
    }
}
