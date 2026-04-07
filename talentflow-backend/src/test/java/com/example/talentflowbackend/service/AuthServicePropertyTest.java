package com.example.talentflowbackend.service;

import com.example.talentflowbackend.dto.*;
import com.example.talentflowbackend.entity.Role;
import com.example.talentflowbackend.entity.User;
import com.example.talentflowbackend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.HashSet;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * Property-based and unit tests for AuthService.
 * Covers Properties 7, 8, 9, 10, 11, 21, 22, 23 from the design spec.
 */
class AuthServicePropertyTest {

    private UserRepository userRepository;
    private PasswordEncoder passwordEncoder;
    private JwtService jwtService;
    private OtpService otpService;
    private EmailService emailService;
    private TokenRefreshService tokenRefreshService;
    private AuthService authService;

    @BeforeEach
    void setUp() {
        userRepository = mock(UserRepository.class);
        passwordEncoder = new BCryptPasswordEncoder();
        jwtService = mock(JwtService.class);
        otpService = mock(OtpService.class);
        emailService = mock(EmailService.class);
        tokenRefreshService = mock(TokenRefreshService.class);

        authService = new AuthService(userRepository, passwordEncoder, jwtService,
                otpService, emailService, tokenRefreshService);

        // Set admin code via reflection
        org.springframework.test.util.ReflectionTestUtils.setField(
                authService, "adminRegistrationCode", "ADMIN-SECRET-2024");
    }

    // ── Property 7: BCrypt Password Storage ──────────────────────

    @Test
    @DisplayName("Property 7: registered client password is BCrypt-hashed, not plaintext")
    void property7_clientPasswordIsBcryptHashed() {
        when(userRepository.findByEmail(any())).thenReturn(Optional.empty());
        when(otpService.generateSecret()).thenReturn("JBSWY3DPEHPK3PXP");
        when(otpService.generateQrCodeDataUri(any(), any())).thenReturn("data:image/png;base64,abc");
        when(userRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        doNothing().when(emailService).sendClientRegistrationEmail(any(), any());

        ClientRegRequest req = new ClientRegRequest();
        req.setFullName("Test Client");
        req.setEmail("client@example.com");
        req.setPassword("SecurePass123!");
        req.setPhoneNumber("0771234567");

        org.mockito.ArgumentCaptor<User> captor = org.mockito.ArgumentCaptor.forClass(User.class);
        when(userRepository.save(captor.capture())).thenAnswer(inv -> inv.getArgument(0));

        authService.registerClient(req);

        User saved = captor.getValue();
        assertNotNull(saved.getClientPassword());
        assertNotEquals("SecurePass123!", saved.getClientPassword(),
                "Stored password must not be plaintext");
        assertTrue(passwordEncoder.matches("SecurePass123!", saved.getClientPassword()),
                "BCrypt.matches must return true for correct password");
    }

    // ── Property 9: New User Registration Returns QR Code ────────

    @Test
    @DisplayName("Property 9: new user registration returns non-null qrCode and totpSecret")
    void property9_newUserRegistrationReturnsQrCode() {
        when(userRepository.findByEmail(any())).thenReturn(Optional.empty());
        when(otpService.generateSecret()).thenReturn("JBSWY3DPEHPK3PXP");
        when(otpService.generateQrCodeDataUri(any(), any())).thenReturn("data:image/png;base64,qrdata");
        when(userRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        doNothing().when(emailService).sendClientRegistrationEmail(any(), any());

        ClientRegRequest req = new ClientRegRequest();
        req.setFullName("New User");
        req.setEmail("new@example.com");
        req.setPassword("Password1!");

        AuthResponse response = authService.registerClient(req);

        assertNotNull(response.getQrCode(), "qrCode must not be null for new user");
        assertNotNull(response.getTotpSecret(), "totpSecret must not be null for new user");
    }

    // ── Property 10: Admin Code Validation ───────────────────────

    @Test
    @DisplayName("Property 10: admin registration succeeds with correct admin code")
    void property10_adminRegistrationSucceedsWithCorrectCode() {
        when(userRepository.findByEmail(any())).thenReturn(Optional.empty());
        when(otpService.generateSecret()).thenReturn("JBSWY3DPEHPK3PXP");
        when(otpService.generateQrCodeDataUri(any(), any())).thenReturn("data:image/png;base64,qr");
        when(userRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        doNothing().when(emailService).sendAdminRegistrationEmail(any(), any());

        AdminRegRequest req = new AdminRegRequest();
        req.setFullName("Admin User");
        req.setEmail("admin@example.com");
        req.setPassword("AdminPass1!");
        req.setAdminCode("ADMIN-SECRET-2024");
        req.setDepartment("security");

        AuthResponse response = authService.registerAdmin(req);
        assertNotNull(response.getQrCode(), "Admin registration with correct code must return QR code");
    }

    @Test
    @DisplayName("Property 10: admin registration fails with wrong admin code")
    void property10_adminRegistrationFailsWithWrongCode() {
        AdminRegRequest req = new AdminRegRequest();
        req.setFullName("Hacker");
        req.setEmail("hacker@example.com");
        req.setPassword("HackPass1!");
        req.setAdminCode("WRONG-CODE");
        req.setDepartment("security");

        AuthResponse response = authService.registerAdmin(req);
        assertNull(response.getQrCode(), "Admin registration with wrong code must not return QR code");
        assertNotNull(response.getMessage());
        assertTrue(response.getMessage().toLowerCase().contains("invalid"),
                "Error message must indicate invalid code");
    }

    // ── Property 11: First Login Step Returns OTP Required ───────

    @Test
    @DisplayName("Property 11: valid credentials return otpRequired=true with no token")
    void property11_validCredentialsReturnOtpRequired() {
        User user = User.builder()
                .id("u1")
                .email("client@example.com")
                .clientPassword(passwordEncoder.encode("Password1!"))
                .roles(new HashSet<>(Set.of(Role.CLIENT)))
                .isActive(true)
                .failedLoginAttempts(0)
                .build();

        when(userRepository.findByEmail("client@example.com")).thenReturn(Optional.of(user));
        when(userRepository.save(any())).thenReturn(user);

        LoginRequest req = new LoginRequest();
        req.setEmail("client@example.com");
        req.setPassword("Password1!");
        req.setRole("CLIENT");

        AuthResponse response = authService.login(req);

        assertTrue(Boolean.TRUE.equals(response.getOtpRequired()),
                "otpRequired must be true after valid credentials");
        assertNull(response.getToken(), "No JWT must be issued at step 1");
    }

    // ── Property 21: Failed Login Increments Counter ─────────────

    @Test
    @DisplayName("Property 21: wrong password increments failedLoginAttempts by 1")
    void property21_wrongPasswordIncrementsCounter() {
        User user = User.builder()
                .id("u1")
                .email("client@example.com")
                .clientPassword(passwordEncoder.encode("CorrectPass1!"))
                .roles(new HashSet<>(Set.of(Role.CLIENT)))
                .isActive(true)
                .failedLoginAttempts(0)
                .build();

        when(userRepository.findByEmail("client@example.com")).thenReturn(Optional.of(user));
        when(userRepository.save(any())).thenReturn(user);

        LoginRequest req = new LoginRequest();
        req.setEmail("client@example.com");
        req.setPassword("WrongPass!");
        req.setRole("CLIENT");

        authService.login(req);

        assertEquals(1, user.getFailedLoginAttempts(),
                "failedLoginAttempts must be incremented by exactly 1");
    }

    // ── Property 22: Lockout After 3 Failures ────────────────────

    @Test
    @DisplayName("Property 22: account locks after 3 consecutive wrong passwords")
    void property22_lockoutAfter3Failures() {
        User user = User.builder()
                .id("u1")
                .email("client@example.com")
                .clientPassword(passwordEncoder.encode("CorrectPass1!"))
                .roles(new HashSet<>(Set.of(Role.CLIENT)))
                .isActive(true)
                .failedLoginAttempts(0)
                .build();

        when(userRepository.findByEmail("client@example.com")).thenReturn(Optional.of(user));
        when(userRepository.save(any())).thenReturn(user);
        doNothing().when(emailService).sendAccountLockedEmail(any(), any(), any(), anyLong());

        LoginRequest req = new LoginRequest();
        req.setEmail("client@example.com");
        req.setPassword("WrongPass!");
        req.setRole("CLIENT");

        // 3 failed attempts
        authService.login(req);
        authService.login(req);
        AuthResponse thirdResponse = authService.login(req);

        assertTrue(Boolean.TRUE.equals(thirdResponse.getLocked()),
                "Account must be locked after 3 failures");
        assertNotNull(thirdResponse.getLockSecondsRemaining());
        assertTrue(thirdResponse.getLockSecondsRemaining() > 0);
        assertNotNull(user.getLockedUntil(), "lockedUntil must be set");
        verify(emailService).sendAccountLockedEmail(any(), any(), any(), anyLong());
    }

    // ── Property 23: Success Resets Failure Counters ─────────────

    @Test
    @DisplayName("Property 23: successful password verification resets failedLoginAttempts to 0")
    void property23_successResetsCounter() {
        User user = User.builder()
                .id("u1")
                .email("client@example.com")
                .clientPassword(passwordEncoder.encode("CorrectPass1!"))
                .roles(new HashSet<>(Set.of(Role.CLIENT)))
                .isActive(true)
                .failedLoginAttempts(2)
                .build();

        when(userRepository.findByEmail("client@example.com")).thenReturn(Optional.of(user));
        when(userRepository.save(any())).thenReturn(user);

        LoginRequest req = new LoginRequest();
        req.setEmail("client@example.com");
        req.setPassword("CorrectPass1!");
        req.setRole("CLIENT");

        AuthResponse response = authService.login(req);

        assertTrue(Boolean.TRUE.equals(response.getOtpRequired()));
        assertEquals(0, user.getFailedLoginAttempts(),
                "failedLoginAttempts must be reset to 0 on successful password");
    }
}
