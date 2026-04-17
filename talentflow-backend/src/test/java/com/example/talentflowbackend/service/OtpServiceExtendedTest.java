package com.example.talentflowbackend.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.RepeatedTest;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Extended unit tests for OtpService.
 */
class OtpServiceExtendedTest {

    private OtpService otpService;

    @BeforeEach
    void setUp() {
        otpService = new OtpService();
        ReflectionTestUtils.setField(otpService, "issuer", "TalentFlowAI");
    }

    // ── Secret generation ─────────────────────────────────────────

    @RepeatedTest(10)
    @DisplayName("generateSecret() always returns a non-blank Base32 string")
    void generateSecret_alwaysNonBlank() {
        String secret = otpService.generateSecret();
        assertNotNull(secret);
        assertFalse(secret.isBlank());
        assertTrue(secret.matches("[A-Z2-7=]+"), "Must be Base32: " + secret);
    }

    @Test
    @DisplayName("generateSecret() returns strings of at least 16 characters")
    void generateSecret_minLength() {
        for (int i = 0; i < 20; i++) {
            assertTrue(otpService.generateSecret().length() >= 16);
        }
    }

    @Test
    @DisplayName("100 generated secrets are all unique")
    void generateSecret_allUnique() {
        java.util.Set<String> secrets = new java.util.HashSet<>();
        for (int i = 0; i < 100; i++) secrets.add(otpService.generateSecret());
        assertEquals(100, secrets.size(), "All secrets must be unique");
    }

    // ── QR code ───────────────────────────────────────────────────

    @Test
    @DisplayName("QR code URI starts with data:image/png;base64,")
    void qrCode_startsWithPngDataUri() {
        String uri = otpService.generateQrCodeDataUri("user@test.com", otpService.generateSecret());
        assertTrue(uri.startsWith("data:image/png;base64,"));
    }

    @Test
    @DisplayName("QR code URI is non-empty and reasonably long")
    void qrCode_isNonEmpty() {
        String uri = otpService.generateQrCodeDataUri("user@test.com", otpService.generateSecret());
        assertTrue(uri.length() > 100, "QR code should be a substantial base64 string");
    }

    @Test
    @DisplayName("Different emails produce different QR codes")
    void qrCode_differentForDifferentEmails() {
        String secret = otpService.generateSecret();
        String uri1 = otpService.generateQrCodeDataUri("user1@test.com", secret);
        String uri2 = otpService.generateQrCodeDataUri("user2@test.com", secret);
        assertNotEquals(uri1, uri2);
    }

    // ── verifyCode edge cases ─────────────────────────────────────

    @Test
    @DisplayName("verifyCode returns false for null secret")
    void verifyCode_nullSecret_returnsFalse() {
        assertFalse(otpService.verifyCode(null, "123456"));
    }

    @Test
    @DisplayName("verifyCode returns false for blank secret")
    void verifyCode_blankSecret_returnsFalse() {
        assertFalse(otpService.verifyCode("", "123456"));
    }

    @Test
    @DisplayName("verifyCode returns false for 4-digit code")
    void verifyCode_fourDigits_returnsFalse() {
        assertFalse(otpService.verifyCode(otpService.generateSecret(), "1234"));
    }

    @Test
    @DisplayName("verifyCode returns false for 8-digit code")
    void verifyCode_eightDigits_returnsFalse() {
        assertFalse(otpService.verifyCode(otpService.generateSecret(), "12345678"));
    }

    @Test
    @DisplayName("verifyCode returns false for letters")
    void verifyCode_letters_returnsFalse() {
        assertFalse(otpService.verifyCode(otpService.generateSecret(), "abcdef"));
    }

    @Test
    @DisplayName("verifyCode returns false for special characters")
    void verifyCode_specialChars_returnsFalse() {
        assertFalse(otpService.verifyCode(otpService.generateSecret(), "!@#$%^"));
    }

    @Test
    @DisplayName("verifyCode never throws for any input")
    void verifyCode_neverThrows() {
        String secret = otpService.generateSecret();
        String[] inputs = {null, "", "abc", "123", "1234567", "000000", "999999", "!@#$%^"};
        for (String input : inputs) {
            assertDoesNotThrow(() -> otpService.verifyCode(secret, input),
                    "Should not throw for input: " + input);
        }
    }

    // ── Round-trip ────────────────────────────────────────────────

    @Test
    @DisplayName("Current TOTP code verifies against its own secret")
    void verifyCode_currentCode_returnsTrue() throws Exception {
        String secret = otpService.generateSecret();
        dev.samstevens.totp.code.DefaultCodeGenerator gen =
                new dev.samstevens.totp.code.DefaultCodeGenerator();
        String currentCode = gen.generate(secret, Math.floorDiv(System.currentTimeMillis(), 30_000));
        assertTrue(otpService.verifyCode(secret, currentCode));
    }
}
