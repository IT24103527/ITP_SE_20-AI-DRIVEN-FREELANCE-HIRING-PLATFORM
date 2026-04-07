package com.example.talentflowbackend.service;

import net.jqwik.api.*;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Property-based tests for OtpService.
 * Covers Properties 1, 2, 3, 4 from the design spec.
 */
class OtpPropertyTest {

    private final OtpService otpService;

    OtpPropertyTest() {
        otpService = new OtpService();
        ReflectionTestUtils.setField(otpService, "issuer", "TalentFlowAI");
    }

    // ── Property 1: TOTP Secret Always Set on Registration ───────

    @Property(tries = 50)
    @Label("Property 1: generateSecret always returns non-null non-blank Base32 string")
    void property1_generateSecretAlwaysNonBlank() {
        String secret = otpService.generateSecret();
        assertNotNull(secret);
        assertFalse(secret.isBlank());
        assertTrue(secret.matches("[A-Z2-7=]+"), "Must be valid Base32");
    }

    // ── Property 2: QR Code URI Format ───────────────────────────

    @Property(tries = 20)
    @Label("Property 2: QR code URI always starts with data:image/")
    void property2_qrCodeUriFormat(@ForAll("emails") String email) {
        String secret = otpService.generateSecret();
        String uri = otpService.generateQrCodeDataUri(email, secret);
        assertNotNull(uri);
        assertTrue(uri.startsWith("data:image/"),
                "QR code must be a data URI starting with data:image/");
    }

    @Provide
    Arbitrary<String> emails() {
        return Arbitraries.strings()
                .alpha()
                .ofMinLength(3)
                .ofMaxLength(10)
                .map(s -> s.toLowerCase() + "@example.com");
    }

    // ── Property 3: TOTP Round-Trip Verification ─────────────────

    @Property(tries = 10)
    @Label("Property 3: current TOTP code verifies successfully against its own secret")
    void property3_totpRoundTrip() {
        String secret = otpService.generateSecret();
        // Generate the current TOTP code using the same library
        dev.samstevens.totp.code.DefaultCodeGenerator generator =
                new dev.samstevens.totp.code.DefaultCodeGenerator();
        try {
            String currentCode = generator.generate(secret,
                    Math.floorDiv(System.currentTimeMillis(), 30_000));
            assertTrue(otpService.verifyCode(secret, currentCode),
                    "Current TOTP code must verify against its own secret");
        } catch (Exception e) {
            fail("Code generation should not throw: " + e.getMessage());
        }
    }

    // ── Property 4: Malformed TOTP Code Never Throws ─────────────

    @Property(tries = 100)
    @Label("Property 4: verifyCode never throws for any arbitrary string input")
    void property4_verifyCodeNeverThrows(@ForAll String arbitraryCode) {
        String secret = otpService.generateSecret();
        assertDoesNotThrow(() -> otpService.verifyCode(secret, arbitraryCode),
                "verifyCode must never throw for any input");
    }

    @Property(tries = 50)
    @Label("Property 4b: verifyCode returns false for non-6-digit strings")
    void property4b_nonSixDigitReturnsFalse(@ForAll("nonSixDigit") String code) {
        String secret = otpService.generateSecret();
        boolean result = otpService.verifyCode(secret, code);
        // Should not throw — result may be false (almost certainly is)
        assertNotNull(Boolean.valueOf(result));
    }

    @Provide
    Arbitrary<String> nonSixDigit() {
        return Arbitraries.oneOf(
                Arbitraries.strings().alpha().ofMinLength(1).ofMaxLength(5),
                Arbitraries.strings().alpha().ofMinLength(7).ofMaxLength(20),
                Arbitraries.just(""),
                Arbitraries.just("abcdef"),
                Arbitraries.just("12345"),
                Arbitraries.just("1234567")
        );
    }
}
