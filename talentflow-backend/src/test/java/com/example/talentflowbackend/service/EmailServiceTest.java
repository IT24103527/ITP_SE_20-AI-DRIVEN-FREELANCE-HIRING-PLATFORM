package com.example.talentflowbackend.service;

import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for EmailService.
 * Verifies async dispatch, exception swallowing, and all email method variants.
 */
class EmailServiceTest {

    private JavaMailSender mailSender;
    private EmailService emailService;
    private MimeMessage mimeMessage;

    @BeforeEach
    void setUp() {
        mailSender = mock(JavaMailSender.class);
        mimeMessage = mock(MimeMessage.class);
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);

        emailService = new EmailService(mailSender);
        ReflectionTestUtils.setField(emailService, "fromAddress", "noreply@talentflowai.lk");
    }

    // ── Exception swallowing (Property 28) ───────────────────────

    @Test
    @DisplayName("send() swallows JavaMailSender exception — does not propagate")
    void send_mailSenderThrows_doesNotPropagate() {
        when(mailSender.createMimeMessage()).thenThrow(new RuntimeException("SMTP down"));
        assertDoesNotThrow(() -> emailService.send("to@test.com", "Subject", "<p>Body</p>"));
    }

    @Test
    @DisplayName("sendClientRegistrationEmail() swallows exception silently")
    void sendClientRegistrationEmail_exceptionSwallowed() {
        when(mailSender.createMimeMessage()).thenThrow(new RuntimeException("SMTP error"));
        assertDoesNotThrow(() -> emailService.sendClientRegistrationEmail("c@test.com", "Client"));
    }

    @Test
    @DisplayName("sendFreelancerRegistrationEmail() swallows exception silently")
    void sendFreelancerRegistrationEmail_exceptionSwallowed() {
        when(mailSender.createMimeMessage()).thenThrow(new RuntimeException("SMTP error"));
        assertDoesNotThrow(() -> emailService.sendFreelancerRegistrationEmail("f@test.com", "Freelancer"));
    }

    @Test
    @DisplayName("sendAdminRegistrationEmail() swallows exception silently")
    void sendAdminRegistrationEmail_exceptionSwallowed() {
        when(mailSender.createMimeMessage()).thenThrow(new RuntimeException("SMTP error"));
        assertDoesNotThrow(() -> emailService.sendAdminRegistrationEmail("a@test.com", "Admin"));
    }

    @Test
    @DisplayName("sendAccountLockedEmail() swallows exception silently")
    void sendAccountLockedEmail_exceptionSwallowed() {
        when(mailSender.createMimeMessage()).thenThrow(new RuntimeException("SMTP error"));
        assertDoesNotThrow(() -> emailService.sendAccountLockedEmail(
                "u@test.com", "User", "Too many attempts", 60L));
    }

    @Test
    @DisplayName("sendSensitiveActionOtpEmail() swallows exception silently")
    void sendSensitiveActionOtpEmail_exceptionSwallowed() {
        when(mailSender.createMimeMessage()).thenThrow(new RuntimeException("SMTP error"));
        assertDoesNotThrow(() -> emailService.sendSensitiveActionOtpEmail(
                "u@test.com", "User", "WITHDRAW", "123456"));
    }

    // ── All email methods invoke mailSender ───────────────────────

    @Test
    @DisplayName("sendClientLoginEmail() calls mailSender.send()")
    void sendClientLoginEmail_callsMailSender() {
        emailService.sendClientLoginEmail("c@test.com", "Client");
        verify(mailSender, atLeastOnce()).send(any(MimeMessage.class));
    }

    @Test
    @DisplayName("sendFreelancerLoginEmail() calls mailSender.send()")
    void sendFreelancerLoginEmail_callsMailSender() {
        emailService.sendFreelancerLoginEmail("f@test.com", "Freelancer");
        verify(mailSender, atLeastOnce()).send(any(MimeMessage.class));
    }

    @Test
    @DisplayName("sendAdminLoginEmail() calls mailSender.send()")
    void sendAdminLoginEmail_callsMailSender() {
        emailService.sendAdminLoginEmail("a@test.com", "Admin");
        verify(mailSender, atLeastOnce()).send(any(MimeMessage.class));
    }

    @Test
    @DisplayName("sendSensitiveActionOtpEmail() calls mailSender.send() for WITHDRAW action")
    void sendSensitiveActionOtpEmail_withdraw_callsMailSender() {
        emailService.sendSensitiveActionOtpEmail("u@test.com", "User", "WITHDRAW", "654321");
        verify(mailSender, atLeastOnce()).send(any(MimeMessage.class));
    }

    @Test
    @DisplayName("sendSensitiveActionOtpEmail() calls mailSender.send() for CHANGE_PASSWORD action")
    void sendSensitiveActionOtpEmail_changePassword_callsMailSender() {
        emailService.sendSensitiveActionOtpEmail("u@test.com", "User", "CHANGE_PASSWORD", "111222");
        verify(mailSender, atLeastOnce()).send(any(MimeMessage.class));
    }

    @Test
    @DisplayName("sendSensitiveActionOtpEmail() calls mailSender.send() for CHANGE_EMAIL action")
    void sendSensitiveActionOtpEmail_changeEmail_callsMailSender() {
        emailService.sendSensitiveActionOtpEmail("u@test.com", "User", "CHANGE_EMAIL", "333444");
        verify(mailSender, atLeastOnce()).send(any(MimeMessage.class));
    }

    @Test
    @DisplayName("sendAccountLockedEmail() calls mailSender.send()")
    void sendAccountLockedEmail_callsMailSender() {
        emailService.sendAccountLockedEmail("u@test.com", "User", "Too many OTP failures", 60L);
        verify(mailSender, atLeastOnce()).send(any(MimeMessage.class));
    }
}
