package com.example.talentflowbackend.service;

import com.example.talentflowbackend.entity.SensitiveOtp;
import com.example.talentflowbackend.repository.SensitiveOtpRepository;
import net.jqwik.api.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Date;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * Property-based and unit tests for SensitiveActionOtpService.
 * Covers Properties 5, 6, 17, 18, 19, 20, 31 from the design spec.
 */
class SensitiveActionOtpServiceTest {

    private SensitiveOtpRepository sensitiveOtpRepository;
    private EmailService emailService;
    private PasswordEncoder passwordEncoder;
    private SensitiveActionOtpService service;

    @BeforeEach
    void setUp() {
        sensitiveOtpRepository = mock(SensitiveOtpRepository.class);
        emailService = mock(EmailService.class);
        passwordEncoder = new BCryptPasswordEncoder();
        service = new SensitiveActionOtpService(sensitiveOtpRepository, emailService, passwordEncoder);
    }

    // ── Property 5: Sensitive OTP Is Always 6 Digits ─────────────

    @Test
    @DisplayName("Property 5: requestOtp always generates a 6-digit numeric OTP")
    void requestOtp_alwaysGenerates6DigitOtp() {
        ArgumentCaptor<SensitiveOtp> captor = ArgumentCaptor.forClass(SensitiveOtp.class);
        when(sensitiveOtpRepository.save(any())).thenReturn(null);

        // Capture the raw OTP via email service
        ArgumentCaptor<String> otpCaptor = ArgumentCaptor.forClass(String.class);
        doNothing().when(emailService).sendSensitiveActionOtpEmail(any(), any(), any(), otpCaptor.capture());

        for (int i = 0; i < 20; i++) {
            service.requestOtp("test@example.com", "Test User", "WITHDRAW");
            String capturedOtp = otpCaptor.getValue();
            assertNotNull(capturedOtp);
            assertEquals(6, capturedOtp.length(), "OTP must be exactly 6 digits");
            assertTrue(capturedOtp.matches("\\d{6}"), "OTP must be numeric");
            int otpValue = Integer.parseInt(capturedOtp);
            assertTrue(otpValue >= 100_000 && otpValue <= 999_999, "OTP must be in range [100000, 999999]");
        }
    }

    // ── Property 6: Sensitive OTP Storage with TTL ────────────────

    @Test
    @DisplayName("Property 6: stored OTP record has expiresAt ~5 min in future and used=false")
    void requestOtp_storesRecordWithCorrectTtlAndUsedFalse() {
        ArgumentCaptor<SensitiveOtp> captor = ArgumentCaptor.forClass(SensitiveOtp.class);
        when(sensitiveOtpRepository.save(captor.capture())).thenReturn(null);
        doNothing().when(emailService).sendSensitiveActionOtpEmail(any(), any(), any(), any());

        long before = System.currentTimeMillis();
        service.requestOtp("test@example.com", "Test User", "CHANGE_EMAIL");
        long after = System.currentTimeMillis();

        SensitiveOtp saved = captor.getValue();
        assertNotNull(saved);
        assertFalse(saved.isUsed(), "Newly stored OTP must have used=false");
        assertNotNull(saved.getExpiresAt());

        long expiresMs = saved.getExpiresAt().getTime();
        long expectedMin = before + 4 * 60 * 1000; // at least 4 min
        long expectedMax = after  + 6 * 60 * 1000; // at most 6 min
        assertTrue(expiresMs >= expectedMin && expiresMs <= expectedMax,
                "expiresAt must be approximately 5 minutes from now");
    }          

    // ── Property 17: Round-Trip Verification ─────────────────────

    @Test
    @DisplayName("Property 17: verifyOtp returns true for correct OTP immediately after requestOtp")
    void verifyOtp_roundTripReturnsTrue() {
        ArgumentCaptor<String> otpCaptor = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<SensitiveOtp> saveCaptor = ArgumentCaptor.forClass(SensitiveOtp.class);

        doNothing().when(emailService).sendSensitiveActionOtpEmail(any(), any(), any(), otpCaptor.capture());
        when(sensitiveOtpRepository.save(saveCaptor.capture())).thenAnswer(inv -> inv.getArgument(0));

        service.requestOtp("user@example.com", "User", "CHANGE_PASSWORD");

        String rawOtp = otpCaptor.getValue();
        SensitiveOtp stored = saveCaptor.getValue();

        when(sensitiveOtpRepository.findByEmailAndAction("user@example.com", "CHANGE_PASSWORD"))
                .thenReturn(Optional.of(stored));
        when(sensitiveOtpRepository.save(any())).thenReturn(stored);

        boolean result = service.verifyOtp("user@example.com", "CHANGE_PASSWORD", rawOtp);
        assertTrue(result, "Round-trip OTP verification must return true");
    }

    // ── Property 18: Single-Use Guarantee ────────────────────────

    @Test
    @DisplayName("Property 18: verifyOtp returns false on second call with same OTP")
    void verifyOtp_singleUseGuarantee() {
        ArgumentCaptor<String> otpCaptor = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<SensitiveOtp> saveCaptor = ArgumentCaptor.forClass(SensitiveOtp.class);

        doNothing().when(emailService).sendSensitiveActionOtpEmail(any(), any(), any(), otpCaptor.capture());
        when(sensitiveOtpRepository.save(saveCaptor.capture())).thenAnswer(inv -> inv.getArgument(0));

        service.requestOtp("user@example.com", "User", "WITHDRAW");
        String rawOtp = otpCaptor.getValue();
        SensitiveOtp stored = saveCaptor.getValue();

        when(sensitiveOtpRepository.findByEmailAndAction("user@example.com", "WITHDRAW"))
                .thenReturn(Optional.of(stored));
        when(sensitiveOtpRepository.save(any())).thenReturn(stored);

        // First call — should succeed
        assertTrue(service.verifyOtp("user@example.com", "WITHDRAW", rawOtp));

        // Second call — record is now used=true
        assertFalse(service.verifyOtp("user@example.com", "WITHDRAW", rawOtp),
                "Second verification with same OTP must return false");
    }

    // ── Property 19: Wrong OTP Returns False ─────────────────────

    @Test
    @DisplayName("Property 19: verifyOtp returns false for wrong OTP without state mutation")
    void verifyOtp_wrongOtpReturnsFalse() {
        SensitiveOtp record = SensitiveOtp.builder()
                .email("user@example.com")
                .action("CHANGE_EMAIL")
                .otpHash(passwordEncoder.encode("123456"))
                .expiresAt(new Date(System.currentTimeMillis() + 300_000))
                .used(false)
                .build();

        when(sensitiveOtpRepository.findByEmailAndAction("user@example.com", "CHANGE_EMAIL"))
                .thenReturn(Optional.of(record));

        boolean result = service.verifyOtp("user@example.com", "CHANGE_EMAIL", "999999");
        assertFalse(result, "Wrong OTP must return false");
        assertFalse(record.isUsed(), "Record must not be mutated on wrong OTP");
        verify(sensitiveOtpRepository, never()).save(any());
    }

    // ── Property 20: Invalid Action Rejected ─────────────────────

    @Test
    @DisplayName("Property 20: requestOtp throws for invalid action")
    void requestOtp_invalidActionThrows() {
        assertThrows(IllegalArgumentException.class,
                () -> service.requestOtp("user@example.com", "User", "INVALID_ACTION"));
    }

    @Test
    @DisplayName("Property 20: verifyOtp throws for invalid action")
    void verifyOtp_invalidActionThrows() {
        assertThrows(IllegalArgumentException.class,
                () -> service.verifyOtp("user@example.com", "HACK", "123456"));
    }

    // ── Property 31: OTP Stored as BCrypt Hash ───────────────────

    @Test
    @DisplayName("Property 31: stored otpHash is BCrypt hash, not raw OTP")
    void requestOtp_storesHashNotRawOtp() {
        ArgumentCaptor<String> otpCaptor = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<SensitiveOtp> saveCaptor = ArgumentCaptor.forClass(SensitiveOtp.class);

        doNothing().when(emailService).sendSensitiveActionOtpEmail(any(), any(), any(), otpCaptor.capture());
        when(sensitiveOtpRepository.save(saveCaptor.capture())).thenAnswer(inv -> inv.getArgument(0));

        service.requestOtp("user@example.com", "User", "WITHDRAW");

        String rawOtp = otpCaptor.getValue();
        SensitiveOtp saved = saveCaptor.getValue();

        assertNotEquals(rawOtp, saved.getOtpHash(), "Stored hash must not equal raw OTP");
        assertTrue(passwordEncoder.matches(rawOtp, saved.getOtpHash()),
                "BCrypt.matches(rawOtp, storedHash) must return true");
    }

    // ── Property 4 (adapted): Expired OTP returns false ──────────

    @Test
    @DisplayName("Expired OTP record returns false and is deleted")
    void verifyOtp_expiredRecordReturnsFalse() {
        SensitiveOtp expired = SensitiveOtp.builder()
                .email("user@example.com")
                .action("WITHDRAW")
                .otpHash(passwordEncoder.encode("123456"))
                .expiresAt(new Date(System.currentTimeMillis() - 1000)) // already expired
                .used(false)
                .build();

        when(sensitiveOtpRepository.findByEmailAndAction("user@example.com", "WITHDRAW"))
                .thenReturn(Optional.of(expired));

        boolean result = service.verifyOtp("user@example.com", "WITHDRAW", "123456");
        assertFalse(result, "Expired OTP must return false");
        verify(sensitiveOtpRepository).delete(expired);
    }
}
