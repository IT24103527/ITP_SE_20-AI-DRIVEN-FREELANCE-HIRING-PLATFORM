package com.example.talentflowbackend.service;

import com.example.talentflowbackend.dto.*;
import com.example.talentflowbackend.entity.Role;
import com.example.talentflowbackend.entity.User;
import com.example.talentflowbackend.repository.UserRepository;import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for AuthService.
 * Uses Mockito to isolate the service from MongoDB, email, and TOTP dependencies.
 */
@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private JwtService jwtService;
    @Mock private OtpService otpService;
    @Mock private EmailService emailService;
    @Mock private TokenRefreshService tokenRefreshService;

    @InjectMocks
    private AuthService authService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(authService, "adminRegistrationCode", "123456789");
    }

    // ── Helpers ───────────────────────────────────────────────────

    private User activeClientUser(String email) {
        return User.builder()
                .id("id-001").email(email).fullName("Test User")
                .clientPassword("encoded_pass")
                .totpSecret("TOTP_SECRET")
                .roles(new HashSet<>(Set.of(Role.CLIENT)))
                .isActive(true)
                .failedLoginAttempts(0).failedOtpAttempts(0)
                .build();
    }

    // ── registerClient ────────────────────────────────────────────

    @Test
    @DisplayName("registerClient() — new email creates account and returns QR code")
    void registerClient_newEmail_returnsQrCode() {
        when(userRepository.findByEmail("new@test.com")).thenReturn(Optional.empty());
        when(passwordEncoder.encode(any())).thenReturn("encoded");
        when(otpService.generateSecret()).thenReturn("SECRET");
        when(otpService.generateQrCodeDataUri(any(), any())).thenReturn("data:image/png;base64,abc");
        when(userRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        ClientRegRequest req = new ClientRegRequest();
        req.setFullName("New User"); req.setEmail("new@test.com"); req.setPassword("Pass1");

        AuthResponse resp = authService.registerClient(req);

        assertEquals("CLIENT", resp.getRole());
        assertNotNull(resp.getQrCode());
        verify(emailService).sendClientRegistrationEmail(eq("new@test.com"), any());
    }

    @Test
    @DisplayName("registerClient() — existing email with CLIENT role returns 'already exists'")
    void registerClient_existingClientEmail_returnsAlreadyExists() {
        when(userRepository.findByEmail("existing@test.com"))
                .thenReturn(Optional.of(activeClientUser("existing@test.com")));

        ClientRegRequest req = new ClientRegRequest();
        req.setEmail("existing@test.com"); req.setPassword("Pass1"); req.setFullName("X");

        AuthResponse resp = authService.registerClient(req);

        assertEquals("A Client account already exists for this email.", resp.getMessage());
        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("registerClient() — existing email with FREELANCER role adds CLIENT role")
    void registerClient_existingFreelancerEmail_addsClientRole() {
        User freelancer = User.builder()
                .id("id-002").email("fl@test.com").fullName("FL User")
                .freelancerPassword("encoded")
                .totpSecret("SECRET")
                .roles(new HashSet<>(Set.of(Role.FREELANCER)))
                .isActive(true).build();

        when(userRepository.findByEmail("fl@test.com")).thenReturn(Optional.of(freelancer));
        when(passwordEncoder.encode(any())).thenReturn("encoded_client");
        when(userRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        ClientRegRequest req = new ClientRegRequest();
        req.setEmail("fl@test.com"); req.setPassword("ClientPass1"); req.setFullName("FL User");

        AuthResponse resp = authService.registerClient(req);

        assertEquals("CLIENT", resp.getRole());
        assertTrue(resp.getMessage().contains("Client account created"));
        verify(emailService).sendClientRegistrationEmail(eq("fl@test.com"), any());
    }

    // ── registerAdmin ─────────────────────────────────────────────

    @Test
    @DisplayName("registerAdmin() — wrong admin code returns error immediately")
    void registerAdmin_wrongCode_returnsError() {
        AdminRegRequest req = new AdminRegRequest();
        req.setAdminCode("WRONG"); req.setEmail("a@test.com");
        req.setPassword("Pass1"); req.setFullName("A"); req.setDepartment("IT");

        AuthResponse resp = authService.registerAdmin(req);

        assertEquals("Invalid admin registration code.", resp.getMessage());
        verify(userRepository, never()).findByEmail(any());
    }

    @Test
    @DisplayName("registerAdmin() — correct code, new email creates admin account")
    void registerAdmin_correctCode_newEmail_createsAccount() {
        when(userRepository.findByEmail("admin@test.com")).thenReturn(Optional.empty());
        when(passwordEncoder.encode(any())).thenReturn("encoded");
        when(otpService.generateSecret()).thenReturn("SECRET");
        when(otpService.generateQrCodeDataUri(any(), any())).thenReturn("data:image/png;base64,xyz");
        when(userRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        AdminRegRequest req = new AdminRegRequest();
        req.setAdminCode("123456789"); req.setEmail("admin@test.com");
        req.setPassword("Pass1"); req.setFullName("Admin"); req.setDepartment("IT");

        AuthResponse resp = authService.registerAdmin(req);

        assertEquals("ADMIN", resp.getRole());
        assertNotNull(resp.getQrCode());
        verify(emailService).sendAdminRegistrationEmail(eq("admin@test.com"), any());
    }

    // ── login ─────────────────────────────────────────────────────

    @Test
    @DisplayName("login() — non-existent email returns 'Invalid email or password'")
    void login_nonExistentEmail_returnsInvalidMessage() {
        when(userRepository.findByEmail("ghost@test.com")).thenReturn(Optional.empty());

        LoginRequest req = new LoginRequest();
        req.setEmail("ghost@test.com"); req.setPassword("Pass1"); req.setRole("CLIENT");

        AuthResponse resp = authService.login(req);

        assertEquals("Invalid email or password.", resp.getMessage());
        assertNull(resp.getToken());
    }

    @Test
    @DisplayName("login() — missing role returns 'Role is required'")
    void login_missingRole_returnsRoleRequired() {
        LoginRequest req = new LoginRequest();
        req.setEmail("client@test.com"); req.setPassword("Pass1"); req.setRole(null);

        AuthResponse resp = authService.login(req);

        assertEquals("Role is required to log in.", resp.getMessage());
        verify(userRepository, never()).findByEmail(any());
    }

    @Test
    @DisplayName("login() — user doesn't have requested role returns 'no account' message")
    void login_userLacksRequestedRole_returnsNoAccountMessage() {
        when(userRepository.findByEmail("client@test.com"))
                .thenReturn(Optional.of(activeClientUser("client@test.com")));

        LoginRequest req = new LoginRequest();
        req.setEmail("client@test.com"); req.setPassword("Pass1"); req.setRole("FREELANCER");

        AuthResponse resp = authService.login(req);

        assertTrue(resp.getMessage().contains("No FREELANCER account found"));
    }

    @Test
    @DisplayName("login() — wrong password increments failedLoginAttempts")
    void login_wrongPassword_incrementsAttempts() {
        User user = activeClientUser("client@test.com");
        when(userRepository.findByEmail("client@test.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches(any(), any())).thenReturn(false);
        when(userRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        LoginRequest req = new LoginRequest();
        req.setEmail("client@test.com"); req.setPassword("WrongPass"); req.setRole("CLIENT");

        AuthResponse resp = authService.login(req);

        assertTrue(resp.getMessage().contains("attempt(s) remaining"));
        assertNull(resp.getToken());
    }

    @Test
    @DisplayName("login() — 3 wrong passwords locks the account")
    void login_threeWrongPasswords_locksAccount() {
        User user = activeClientUser("client@test.com");
        user.setFailedLoginAttempts(2); // already 2 failed attempts
        when(userRepository.findByEmail("client@test.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches(any(), any())).thenReturn(false);
        when(userRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        LoginRequest req = new LoginRequest();
        req.setEmail("client@test.com"); req.setPassword("WrongPass"); req.setRole("CLIENT");

        AuthResponse resp = authService.login(req);

        assertTrue(Boolean.TRUE.equals(resp.getLocked()));
        assertTrue(resp.getMessage().contains("locked"));
        verify(emailService).sendAccountLockedEmail(any(), any(), any(), anyLong());
    }

    @Test
    @DisplayName("login() — correct password resets failedLoginAttempts and prompts for OTP")
    void login_correctPassword_promptsForOtp() {
        User user = activeClientUser("client@test.com");
        user.setFailedLoginAttempts(1);
        when(userRepository.findByEmail("client@test.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches(any(), any())).thenReturn(true);
        when(userRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        LoginRequest req = new LoginRequest();
        req.setEmail("client@test.com"); req.setPassword("CorrectPass"); req.setRole("CLIENT");

        AuthResponse resp = authService.login(req);

        assertTrue(Boolean.TRUE.equals(resp.getOtpRequired()));
        assertNull(resp.getToken());
    }

    @Test
    @DisplayName("login() — locked account returns lock message immediately")
    void login_lockedAccount_returnsLockMessage() {
        User user = activeClientUser("locked@test.com");
        user.setLockedUntil(new Date(System.currentTimeMillis() + 60_000));
        when(userRepository.findByEmail("locked@test.com")).thenReturn(Optional.of(user));

        LoginRequest req = new LoginRequest();
        req.setEmail("locked@test.com"); req.setPassword("Pass1"); req.setRole("CLIENT");

        AuthResponse resp = authService.login(req);

        assertTrue(Boolean.TRUE.equals(resp.getLocked()));
        assertTrue(resp.getMessage().contains("locked"));
    }

    // ── verifyLoginOtp ────────────────────────────────────────────

    @Test
    @DisplayName("verifyLoginOtp() — invalid OTP increments failedOtpAttempts")
    void verifyLoginOtp_wrongOtp_incrementsAttempts() {
        User user = activeClientUser("client@test.com");
        when(userRepository.findByEmail("client@test.com")).thenReturn(Optional.of(user));
        when(otpService.verifyCode(any(), any())).thenReturn(false);
        when(userRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        AuthResponse resp = authService.verifyLoginOtp("client@test.com", "000000", "CLIENT");

        assertTrue(resp.getMessage().contains("attempt(s) remaining"));
        assertNull(resp.getToken());
    }

    @Test
    @DisplayName("verifyLoginOtp() — 3 wrong OTPs locks the account")
    void verifyLoginOtp_threeWrongOtps_locksAccount() {
        User user = activeClientUser("client@test.com");
        user.setFailedOtpAttempts(2);
        when(userRepository.findByEmail("client@test.com")).thenReturn(Optional.of(user));
        when(otpService.verifyCode(any(), any())).thenReturn(false);
        when(userRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        AuthResponse resp = authService.verifyLoginOtp("client@test.com", "000000", "CLIENT");

        assertTrue(Boolean.TRUE.equals(resp.getLocked()));
        verify(emailService).sendAccountLockedEmail(any(), any(), any(), anyLong());
    }

    @Test
    @DisplayName("verifyLoginOtp() — valid OTP issues JWT and sends login email")
    void verifyLoginOtp_validOtp_issuesJwt() {
        User user = activeClientUser("client@test.com");
        when(userRepository.findByEmail("client@test.com")).thenReturn(Optional.of(user));
        when(otpService.verifyCode(any(), any())).thenReturn(true);
        when(jwtService.generateToken(any(User.class), any(Role.class))).thenReturn("jwt.token.here");
        when(userRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        when(tokenRefreshService.issueTokenPair(any(), any()))
                .thenReturn(new TokenPair("jwt.token.here", "refresh.token.here"));

        AuthResponse resp = authService.verifyLoginOtp("client@test.com", "123456", "CLIENT");

        assertEquals("jwt.token.here", resp.getToken());
        assertEquals("Login successful", resp.getMessage());
        assertEquals("CLIENT", resp.getRole());
        verify(emailService).sendClientLoginEmail(eq("client@test.com"), any());
    }

    @Test
    @DisplayName("verifyLoginOtp() — valid OTP but wrong role returns 'Invalid role' message")
    void verifyLoginOtp_validOtp_wrongRole_returnsError() {
        User user = activeClientUser("client@test.com"); // only has CLIENT role
        when(userRepository.findByEmail("client@test.com")).thenReturn(Optional.of(user));
        when(otpService.verifyCode(any(), any())).thenReturn(true);

        AuthResponse resp = authService.verifyLoginOtp("client@test.com", "123456", "ADMIN");

        assertEquals("Invalid role for this account.", resp.getMessage());
        assertNull(resp.getToken());
    }

    @Test
    @DisplayName("verifyLoginOtp() — non-existent user returns error message")
    void verifyLoginOtp_nonExistentUser_returnsError() {
        when(userRepository.findByEmail("ghost@test.com")).thenReturn(Optional.empty());

        AuthResponse resp = authService.verifyLoginOtp("ghost@test.com", "123456", "CLIENT");

        assertNotNull(resp.getMessage());
        assertNull(resp.getToken());
    }
}
