package com.example.talentflowbackend.service;

import com.example.talentflowbackend.entity.SensitiveOtp;
import com.example.talentflowbackend.repository.SensitiveOtpRepository;
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
 * Extended unit tests for SensitiveActionOtpService.
 */
class SensitiveActionOtpServiceExtendedTest {

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

    // ── requestOtp ────────────────────────────────────────────────

    @Test
    @DisplayName("requestOtp deletes existing record before saving new one")
    void requestOtp_deletesExistingFirst() {
        doNothing().when(repo).deleteByEmailAndAction(any(), any());
        when(repo.save(any())).thenAnswer(i -> i.getArgument(0));
        doNothing().when(emailService).sendSensitiveActionOtpEmail(any(), any(), any(), any());

        service.requestOtp("u@test.com", "User", "WITHDRAW");

        verify(repo).deleteByEmailAndAction("u@test.com", "WITHDRAW");
    }

    @Test
    @DisplayName("requestOtp saves record with used=false")
    void requestOtp_savedWithUsedFalse() {
        ArgumentCaptor<SensitiveOtp> captor = ArgumentCaptor.forClass(SensitiveOtp.class);
        doNothing().when(repo).deleteByEmailAndAction(any(), any());
        when(repo.save(captor.capture())).thenAnswer(i -> i.getArgument(0));
        doNothing().when(emailService).sendSensitiveActionOtpEmail(any(), any(), any(), any());

        service.requestOtp("u@test.com", "User", "CHANGE_EMAIL");

        assertFalse(captor.getValue().isUsed());
    }

    @Test
    @DisplayName("requestOtp saves record with future expiresAt")
    void requestOtp_futureExpiry() {
        ArgumentCaptor<SensitiveOtp> captor = ArgumentCaptor.forClass(SensitiveOtp.class);
        doNothing().when(repo).deleteByEmailAndAction(any(), any());
        when(repo.save(captor.capture())).thenAnswer(i -> i.getArgument(0));
        doNothing().when(emailService).sendSensitiveActionOtpEmail(any(), any(), any(), any());

        service.requestOtp("u@test.com", "User", "CHANGE_PASSWORD");

        assertTrue(captor.getValue().getExpiresAt().after(new Date()));
    }

    @Test
    @DisplayName("requestOtp triggers email dispatch")
    void requestOtp_triggersEmail() {
        doNothing().when(repo).deleteByEmailAndAction(any(), any());
        when(repo.save(any())).thenAnswer(i -> i.getArgument(0));
        doNothing().when(emailService).sendSensitiveActionOtpEmail(any(), any(), any(), any());

        service.requestOtp("u@test.com", "User", "WITHDRAW");

        verify(emailService).sendSensitiveActionOtpEmail(
                eq("u@test.com"), eq("User"), eq("WITHDRAW"), any());
    }

    // ── verifyOtp ─────────────────────────────────────────────────

    @Test
    @DisplayName("verifyOtp returns false when no record exists")
    void verifyOtp_noRecord_returnsFalse() {
        when(repo.findByEmailAndAction(any(), any())).thenReturn(Optional.empty());
        assertFalse(service.verifyOtp("u@test.com", "WITHDRAW", "123456"));
    }

    @Test
    @DisplayName("verifyOtp returns false for already-used record")
    void verifyOtp_usedRecord_returnsFalse() {
        SensitiveOtp used = SensitiveOtp.builder()
                .email("u@test.com").action("WITHDRAW")
                .otpHash(encoder.encode("123456"))
                .expiresAt(new Date(System.currentTimeMillis() + 300_000))
                .used(true).build();

        when(repo.findByEmailAndAction("u@test.com", "WITHDRAW")).thenReturn(Optional.of(used));

        assertFalse(service.verifyOtp("u@test.com", "WITHDRAW", "123456"));
    }

    @Test
    @DisplayName("verifyOtp returns false for expired record and deletes it")
    void verifyOtp_expiredRecord_returnsFalseAndDeletes() {
        SensitiveOtp expired = SensitiveOtp.builder()
                .email("u@test.com").action("WITHDRAW")
                .otpHash(encoder.encode("123456"))
                .expiresAt(new Date(System.currentTimeMillis() - 1000))
                .used(false).build();

        when(repo.findByEmailAndAction("u@test.com", "WITHDRAW")).thenReturn(Optional.of(expired));

        assertFalse(service.verifyOtp("u@test.com", "WITHDRAW", "123456"));
        verify(repo).delete(expired);
    }

    @Test
    @DisplayName("verifyOtp returns false for wrong OTP without state change")
    void verifyOtp_wrongOtp_returnsFalseNoStateChange() {
        SensitiveOtp record = SensitiveOtp.builder()
                .email("u@test.com").action("CHANGE_EMAIL")
                .otpHash(encoder.encode("111111"))
                .expiresAt(new Date(System.currentTimeMillis() + 300_000))
                .used(false).build();

        when(repo.findByEmailAndAction("u@test.com", "CHANGE_EMAIL")).thenReturn(Optional.of(record));

        assertFalse(service.verifyOtp("u@test.com", "CHANGE_EMAIL", "999999"));
        assertFalse(record.isUsed());
        verify(repo, never()).save(any());
    }

    @Test
    @DisplayName("verifyOtp marks record as used on success")
    void verifyOtp_success_marksUsed() {
        ArgumentCaptor<String> otpCaptor = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<SensitiveOtp> saveCaptor = ArgumentCaptor.forClass(SensitiveOtp.class);

        doNothing().when(repo).deleteByEmailAndAction(any(), any());
        doNothing().when(emailService).sendSensitiveActionOtpEmail(any(), any(), any(), otpCaptor.capture());
        when(repo.save(saveCaptor.capture())).thenAnswer(i -> i.getArgument(0));

        service.requestOtp("u@test.com", "User", "CHANGE_PASSWORD");

        String rawOtp = otpCaptor.getValue();
        SensitiveOtp stored = saveCaptor.getValue();

        when(repo.findByEmailAndAction("u@test.com", "CHANGE_PASSWORD"))
                .thenReturn(Optional.of(stored));
        when(repo.save(any())).thenReturn(stored);

        assertTrue(service.verifyOtp("u@test.com", "CHANGE_PASSWORD", rawOtp));
        assertTrue(stored.isUsed());
    }

    // ── Invalid actions ───────────────────────────────────────────

    @Test
    @DisplayName("requestOtp throws for null action")
    void requestOtp_nullAction_throws() {
        assertThrows(IllegalArgumentException.class,
                () -> service.requestOtp("u@test.com", "User", null));
    }

    @Test
    @DisplayName("verifyOtp throws for unknown action")
    void verifyOtp_unknownAction_throws() {
        assertThrows(IllegalArgumentException.class,
                () -> service.verifyOtp("u@test.com", "DELETE_ACCOUNT", "123456"));
    }

    @Test
    @DisplayName("All three valid actions are accepted by requestOtp")
    void requestOtp_allValidActions_accepted() {
        doNothing().when(repo).deleteByEmailAndAction(any(), any());
        when(repo.save(any())).thenAnswer(i -> i.getArgument(0));
        doNothing().when(emailService).sendSensitiveActionOtpEmail(any(), any(), any(), any());

        assertDoesNotThrow(() -> service.requestOtp("u@test.com", "User", "WITHDRAW"));
        assertDoesNotThrow(() -> service.requestOtp("u@test.com", "User", "CHANGE_EMAIL"));
        assertDoesNotThrow(() -> service.requestOtp("u@test.com", "User", "CHANGE_PASSWORD"));
    }
}
