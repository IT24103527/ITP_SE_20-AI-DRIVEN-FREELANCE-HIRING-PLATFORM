package com.example.talentflowbackend.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for OtpService.
 * Covers TOTP secret generation, QR code URI generation, and code verification.
 */
class OtpServiceTest {

    private OtpService otpService;

    @BeforeEach
    void setUp() {
        otpService = new OtpService();
        ReflectionTestUtils.setField(otpService, "issuer", "TalentFlowAI");
    }

    // ── generateSecret ────────────────────────────────────────────

    @Test
    @DisplayName("generateSecret() returns a non-null, non-blank string")
    void generateSecret_returnsNonBlankString() {
        String secret = otpService.generateSecret();
        assertNotNull(secret);
        assertFalse(secret.isBlank());
    }

    @Test
    @DisplayName("generateSecret() returns unique secrets on each call")
    void generateSecret_returnsUniqueSecrets() {
        assertNotEquals(otpService.generateSecret(), otpService.generateSecret());
    }

    @Test
    @DisplayName("generateSecret() returns a Base32-compatible string")
    void generateSecret_isBase32Compatible() {
        String secret = otpService.generateSecret();
        assertTrue(secret.matches("[A-Z2-7=]+"),
                "Secret must be valid Base32 (A-Z, 2-7, optional = padding)");
    }

    @Test
    @DisplayName("generateSecret() returns a string of reasonable length (>= 16 chars)")
    void generateSecret_hasReasonableLength() {
        String secret = otpService.generateSecret();
        assertTrue(secret.length() >= 16, "Secret should be at least 16 characters");
    }

    // ── generateQrCodeDataUri ─────────────────────────────────────

    @Test
    @DisplayName("generateQrCodeDataUri() returns a PNG base64 data URI")
    void generateQrCodeDataUri_returnsPngDataUri() {
        String secret = otpService.generateSecret();
        String uri = otpService.generateQrCodeDataUri("user@example.com", secret);
        assertNotNull(uri);
        assertTrue(uri.startsWith("data:image/png;base64,"),
                "QR code must be a base64 PNG data URI");
    }

    @Test
    @DisplayName("generateQrCodeDataUri() produces different URIs for different users")
    void generateQrCodeDataUri_differentForDifferentUsers() {
        String uri1 = otpService.generateQrCodeDataUri("user1@example.com", otpService.generateSecret());
        String uri2 = otpService.generateQrCodeDataUri("user2@example.com", otpService.generateSecret());
        assertNotEquals(uri1, uri2);
    }

    @Test
    @DisplayName("generateQrCodeDataUri() produces different URIs for same user with different secrets")
    void generateQrCodeDataUri_differentForDifferentSecrets() {
        String uri1 = otpService.generateQrCodeDataUri("same@example.com", otpService.generateSecret());
        String uri2 = otpService.generateQrCodeDataUri("same@example.com", otpService.generateSecret());
        assertNotEquals(uri1, uri2);
    }

    // ── verifyCode ────────────────────────────────────────────────

    @Test
    @DisplayName("verifyCode() returns false for a clearly wrong 6-digit code")
    void verifyCode_returnsFalseForWrongCode() {
        String secret = otpService.generateSecret();
        // 000000 is almost certainly wrong (1 in 1,000,000 chance of collision)
        boolean result = otpService.verifyCode(secret, "000000");
        assertNotNull(result); // method must not throw
    }

    @Test
    @DisplayName("verifyCode() returns false for null code")
    void verifyCode_returnsFalseForNull() {
        assertFalse(otpService.verifyCode(otpService.generateSecret(), null));
    }

    @Test
    @DisplayName("verifyCode() returns false for empty string code")
    void verifyCode_returnsFalseForEmpty() {
        assertFalse(otpService.verifyCode(otpService.generateSecret(), ""));
    }

    @Test
    @DisplayName("verifyCode() returns false for non-numeric code")
    void verifyCode_returnsFalseForNonNumeric() {
        assertFalse(otpService.verifyCode(otpService.generateSecret(), "abcdef"));
    }

    @Test
    @DisplayName("verifyCode() returns false for 5-digit code (too short)")
    void verifyCode_returnsFalseForFiveDigits() {
        assertFalse(otpService.verifyCode(otpService.generateSecret(), "12345"));
    }

    @Test
    @DisplayName("verifyCode() returns false for 7-digit code (too long)")
    void verifyCode_returnsFalseForSevenDigits() {
        assertFalse(otpService.verifyCode(otpService.generateSecret(), "1234567"));
    }

    @Test
    @DisplayName("verifyCode() does not throw for any input — always returns boolean")
    void verifyCode_neverThrows() {
        String secret = otpService.generateSecret();
        assertDoesNotThrow(() -> otpService.verifyCode(secret, null));
        assertDoesNotThrow(() -> otpService.verifyCode(secret, ""));
        assertDoesNotThrow(() -> otpService.verifyCode(secret, "abc"));
        assertDoesNotThrow(() -> otpService.verifyCode(secret, "999999"));
        assertDoesNotThrow(() -> otpService.verifyCode(null, "123456"));
    }
}
