package com.example.talentflowbackend.volume;

import com.example.talentflowbackend.entity.SensitiveOtp;
import com.example.talentflowbackend.repository.SensitiveOtpRepository;
import com.example.talentflowbackend.service.EmailService;
import com.example.talentflowbackend.service.SensitiveActionOtpService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * Volume tests for SensitiveActionOtpService.
 *
 * Verifies correctness at scale:
 * - 1,000 OTP requests — all generate 6-digit codes
 * - 1,000 OTP requests — all stored with used=false
 * - 500 verifications with wrong OTP — all return false
 * - 1,000 invalid action requests — all throw IllegalArgumentException
 */
@Tag("volume")
class SensitiveOtpVolumeTest {

    private SensitiveOtpRepository repo;
    private EmailService emailService;
    private PasswordEncoder encoder;
    private SensitiveActionOtpService service;

    @BeforeEach
    void setUp() {
        repo = mock(SensitiveOtpRepository.class);
        emailService = mock(EmailService.class);
        encoder = new BCryptPasswordEncoder();
        service = new SensitiveActionOtpService(repo, emailService, encoder);
    }

    // ── VOL-SOTP-01: 1,000 OTP requests — all 6-digit codes ──────

    @Test
    @DisplayName("VOL-SOTP-01: 1,000 OTP requests all generate 6-digit numeric codes")
    void request1000Otps_all6DigitCodes() {
        ArgumentCaptor<String> otpCaptor = ArgumentCaptor.forClass(String.class);
        doNothing().when(repo).deleteByEmailAndAction(any(), any());
        when(repo.save(any())).thenAnswer(i -> i.getArgument(0));
        doNothing().when(emailService).sendSensitiveActionOtpEmail(any(), any(), any(), otpCaptor.capture());

        String[] actions = {"WITHDRAW", "CHANGE_EMAIL", "CHANGE_PASSWORD"};
        int invalid = 0;
        for (int i = 0; i < 1_000; i++) {
            service.requestOtp("user" + i + "@test.com", "User", actions[i % 3]);
            String otp = otpCaptor.getValue();
            if (otp == null || !otp.matches("\\d{6}")) invalid++;
        }
        assertEquals(0, invalid, invalid + " of 1,000 OTPs were not 6-digit numeric");
        System.out.printf("[VOL] 1,000 sensitive OTP requests: 0 invalid codes%n");
    }

    // ── VOL-SOTP-02: 1,000 OTP requests — all stored with used=false

    @Test
    @DisplayName("VOL-SOTP-02: 1,000 OTP requests all stored with used=false")
    void request1000Otps_allStoredWithUsedFalse() {
        ArgumentCaptor<SensitiveOtp> saveCaptor = ArgumentCaptor.forClass(SensitiveOtp.class);
        doNothing().when(repo).deleteByEmailAndAction(any(), any());
        when(repo.save(saveCaptor.capture())).thenAnswer(i -> i.getArgument(0));
        doNothing().when(emailService).sendSensitiveActionOtpEmail(any(), any(), any(), any());

        String[] actions = {"WITHDRAW", "CHANGE_EMAIL", "CHANGE_PASSWORD"};
        for (int i = 0; i < 1_000; i++) {
            service.requestOtp("user" + i + "@test.com", "User", actions[i % 3]);
        }

        List<SensitiveOtp> saved = saveCaptor.getAllValues();
        long usedCount = saved.stream().filter(SensitiveOtp::isUsed).count();
        assertEquals(0, usedCount, usedCount + " of 1,000 stored OTPs had used=true");
        System.out.printf("[VOL] 1,000 stored OTPs: 0 with used=true%n");
    }

    // ── VOL-SOTP-03: 500 wrong OTP verifications — all false ──────

    @Test
    @DisplayName("VOL-SOTP-03: 500 wrong OTP verifications all return false")
    void verify500WrongOtps_allReturnFalse() {
        int wrongResults = 0;
        String[] actions = {"WITHDRAW", "CHANGE_EMAIL", "CHANGE_PASSWORD"};
        for (int i = 0; i < 500; i++) {
            SensitiveOtp record = SensitiveOtp.builder()
                    .email("user" + i + "@test.com")
                    .action(actions[i % 3])
                    .otpHash(encoder.encode("111111"))
                    .expiresAt(new Date(System.currentTimeMillis() + 300_000))
                    .used(false).build();

            when(repo.findByEmailAndAction("user" + i + "@test.com", actions[i % 3]))
                    .thenReturn(Optional.of(record));

            boolean result = service.verifyOtp("user" + i + "@test.com", actions[i % 3], "999999");
            if (result) wrongResults++;
        }
        assertEquals(0, wrongResults, wrongResults + " wrong OTPs returned true");
        System.out.printf("[VOL] 500 wrong OTP verifications: 0 returned true%n");
    }

    // ── VOL-SOTP-04: 1,000 invalid actions — all throw ────────────

    @Test
    @DisplayName("VOL-SOTP-04: 1,000 invalid action requests all throw IllegalArgumentException")
    void request1000InvalidActions_allThrow() {
        String[] invalidActions = {"DELETE", "HACK", "TRANSFER", "ADMIN", "NULL", "", "withdraw"};
        int noThrow = 0;
        for (int i = 0; i < 1_000; i++) {
            String action = invalidActions[i % invalidActions.length];
            try {
                service.requestOtp("user@test.com", "User", action);
                noThrow++;
            } catch (IllegalArgumentException e) {
                // expected
            }
        }
        assertEquals(0, noThrow, noThrow + " invalid actions did not throw");
        System.out.printf("[VOL] 1,000 invalid action requests: all threw IllegalArgumentException%n");
    }

    // ── VOL-SOTP-05: 1,000 OTP requests — all have future expiry ──

    @Test
    @DisplayName("VOL-SOTP-05: 1,000 OTP requests all stored with future expiresAt")
    void request1000Otps_allFutureExpiry() {
        ArgumentCaptor<SensitiveOtp> saveCaptor = ArgumentCaptor.forClass(SensitiveOtp.class);
        doNothing().when(repo).deleteByEmailAndAction(any(), any());
        when(repo.save(saveCaptor.capture())).thenAnswer(i -> i.getArgument(0));
        doNothing().when(emailService).sendSensitiveActionOtpEmail(any(), any(), any(), any());

        for (int i = 0; i < 1_000; i++) {
            service.requestOtp("user" + i + "@test.com", "User", "WITHDRAW");
        }

        Date now = new Date();
        long pastExpiry = saveCaptor.getAllValues().stream()
                .filter(otp -> otp.getExpiresAt().before(now)).count();
        assertEquals(0, pastExpiry, pastExpiry + " of 1,000 OTPs had past expiry");
        System.out.printf("[VOL] 1,000 OTP requests: 0 with past expiry%n");
    }
}
