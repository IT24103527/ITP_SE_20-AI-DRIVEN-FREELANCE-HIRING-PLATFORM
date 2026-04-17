package com.example.talentflowbackend.volume;

import com.example.talentflowbackend.service.OtpService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.HashSet;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Volume tests for OtpService.
 *
 * Verifies correctness at scale:
 * - 10,000 secrets generated — all unique, all valid Base32
 * - 5,000 QR codes generated — all start with data:image/
 * - 10,000 TOTP verifications — none throw exceptions
 * - 1,000 wrong codes — all return false
 */
@Tag("volume")
class OtpVolumeTest {

    private OtpService otpService;

    @BeforeEach
    void setUp() {
        otpService = new OtpService();
        ReflectionTestUtils.setField(otpService, "issuer", "TalentFlowAI");
    }

    // ── VOL-OTP-01: 10,000 secrets — all unique ───────────────────

    @Test
    @DisplayName("VOL-OTP-01: 10,000 generated secrets are all unique")
    void generate10000Secrets_allUnique() {
        int count = 10_000;
        Set<String> secrets = new HashSet<>();
        for (int i = 0; i < count; i++) {
            secrets.add(otpService.generateSecret());
        }
        assertEquals(count, secrets.size(), "Expected " + count + " unique secrets");
        System.out.printf("[VOL] 10,000 TOTP secrets: all unique%n");
    }

    // ── VOL-OTP-02: 10,000 secrets — all valid Base32 ─────────────

    @Test
    @DisplayName("VOL-OTP-02: 10,000 generated secrets are all valid Base32")
    void generate10000Secrets_allValidBase32() {
        int count = 10_000;
        int invalid = 0;
        for (int i = 0; i < count; i++) {
            String secret = otpService.generateSecret();
            if (secret == null || !secret.matches("[A-Z2-7=]+")) invalid++;
        }
        assertEquals(0, invalid, invalid + " of " + count + " secrets were invalid Base32");
        System.out.printf("[VOL] 10,000 TOTP secrets: 0 invalid Base32%n");
    }

    // ── VOL-OTP-03: 5,000 QR codes — all valid data URIs ─────────

    @Test
    @DisplayName("VOL-OTP-03: 5,000 QR codes all start with data:image/")
    void generate5000QrCodes_allValidDataUri() {
        int count = 5_000;
        int invalid = 0;
        for (int i = 0; i < count; i++) {
            String secret = otpService.generateSecret();
            String uri = otpService.generateQrCodeDataUri("user" + i + "@test.com", secret);
            if (uri == null || !uri.startsWith("data:image/")) invalid++;
        }
        assertEquals(0, invalid, invalid + " of " + count + " QR codes were invalid");
        System.out.printf("[VOL] 5,000 QR code generations: 0 invalid%n");
    }

    // ── VOL-OTP-04: 10,000 verifications — none throw ─────────────

    @Test
    @DisplayName("VOL-OTP-04: 10,000 TOTP verifications never throw an exception")
    void verify10000Codes_neverThrow() {
        String secret = otpService.generateSecret();
        int exceptions = 0;
        for (int i = 0; i < 10_000; i++) {
            try {
                otpService.verifyCode(secret, String.format("%06d", i % 1_000_000));
            } catch (Exception e) {
                exceptions++;
            }
        }
        assertEquals(0, exceptions, exceptions + " exceptions thrown during 10,000 verifications");
        System.out.printf("[VOL] 10,000 TOTP verifications: 0 exceptions%n");
    }

    // ── VOL-OTP-05: 1,000 wrong codes — all return false ─────────

    @Test
    @DisplayName("VOL-OTP-05: 1,000 clearly wrong codes all return false")
    void verify1000WrongCodes_allReturnFalse() {
        String secret = otpService.generateSecret();
        int wrongResults = 0;
        // Use codes that are extremely unlikely to be the current TOTP window
        String[] wrongCodes = {"000000", "111111", "222222", "333333", "444444",
                               "555555", "666666", "777777", "888888", "999999"};
        for (int i = 0; i < 1_000; i++) {
            boolean result = otpService.verifyCode(secret, wrongCodes[i % wrongCodes.length]);
            // We can't guarantee all are false (1 in 1M chance of collision), but track
            if (result) wrongResults++;
        }
        // Allow at most 1 accidental match (statistical tolerance)
        assertTrue(wrongResults <= 1,
                wrongResults + " wrong codes returned true (expected 0 or 1 by chance)");
        System.out.printf("[VOL] 1,000 wrong TOTP codes: %d accidental matches%n", wrongResults);
    }

    // ── VOL-OTP-06: 10,000 secrets — all minimum length ──────────

    @Test
    @DisplayName("VOL-OTP-06: 10,000 secrets all have length >= 16")
    void generate10000Secrets_allMinLength() {
        int count = 10_000;
        int tooShort = 0;
        for (int i = 0; i < count; i++) {
            if (otpService.generateSecret().length() < 16) tooShort++;
        }
        assertEquals(0, tooShort, tooShort + " secrets were shorter than 16 characters");
        System.out.printf("[VOL] 10,000 TOTP secrets: 0 below minimum length%n");
    }
}
