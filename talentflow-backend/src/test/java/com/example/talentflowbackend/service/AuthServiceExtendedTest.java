package com.example.talentflowbackend.service;

import com.example.talentflowbackend.dto.*;
import com.example.talentflowbackend.entity.Role;
import com.example.talentflowbackend.entity.User;
import com.example.talentflowbackend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
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
 * Extended unit tests for AuthService covering edge cases not in AuthServiceTest.
 */
@ExtendWith(MockitoExtension.class)
class AuthServiceExtendedTest {

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
        ReflectionTestUtils.setField(authService, "adminRegistrationCode", "ADMIN-CODE-2024");
    }

    private User buildUser(String email, Role role) {
        return User.builder()
                .id("uid-1").email(email).fullName("Test User")
                .clientPassword(role == Role.CLIENT ? "encoded" : null)
                .freelancerPassword(role == Role.FREELANCER ? "encoded" : null)
                .adminPassword(role == Role.ADMIN ? "encoded" : null)
                .totpSecret("TOTP_SECRET")
                .roles(new HashSet<>(Set.of(role)))
                .isActive(true)
                .failedLoginAttempts(0).failedOtpAttempts(0)
                .build();
    }

    // ── registerFreelancer ────────────────────────────────────────

    @Test
    @DisplayName("registerFreelancer() — new email creates account with QR code")
    void registerFreelancer_newEmail_returnsQrCode() {
        when(userRepository.findByEmail("fl@test.com")).thenReturn(Optional.empty());
        when(passwordEncoder.encode(any())).thenReturn("encoded");
        when(otpService.generateSecret()).thenReturn("SECRET");
        when(otpService.generateQrCodeDataUri(any(), any())).thenReturn("data:image/png;base64,fl");
        when(userRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        FreelancerRegRequest req = new FreelancerRegRequest();
        req.setFullName("FL User"); req.setEmail("fl@test.com"); req.setPassword("Pass1");

        AuthResponse resp = authService.registerFreelancer(req);

        assertEquals("FREELANCER", resp.getRole());
        assertNotNull(resp.getQrCode());
        verify(emailService).sendFreelancerRegistrationEmail(eq("fl@test.com"), any());
    }

    @Test
    @DisplayName("registerFreelancer() — existing FREELANCER email returns 'already exists'")
    void registerFreelancer_existingEmail_returnsAlreadyExists() {
        when(userRepository.findByEmail("fl@test.com"))
                .thenReturn(Optional.of(buildUser("fl@test.com", Role.FREELANCER)));

        FreelancerRegRequest req = new FreelancerRegRequest();
        req.setEmail("fl@test.com"); req.setPassword("Pass1"); req.setFullName("FL");

        AuthResponse resp = authService.registerFreelancer(req);
        assertTrue(resp.getMessage().contains("Freelancer account already exists"));
    }

    // ── login — inactive user ─────────────────────────────────────

    @Test
    @DisplayName("login() — inactive user returns 'Invalid email or password'")
    void login_inactiveUser_returnsInvalidMessage() {
        User inactive = buildUser("inactive@test.com", Role.CLIENT);
        inactive.setIsActive(false);
        when(userRepository.findByEmail("inactive@test.com")).thenReturn(Optional.of(inactive));

        LoginRequest req = new LoginRequest();
        req.setEmail("inactive@test.com"); req.setPassword("Pass1"); req.setRole("CLIENT");

        AuthResponse resp = authService.login(req);
        assertEquals("Invalid email or password.", resp.getMessage());
    }

    // ── login — invalid role string ───────────────────────────────

    @Test
    @DisplayName("login() — invalid role string returns 'Role is required'")
    void login_invalidRoleString_returnsRoleRequired() {
        LoginRequest req = new LoginRequest();
        req.setEmail("u@test.com"); req.setPassword("Pass1"); req.setRole("SUPERUSER");

        AuthResponse resp = authService.login(req);
        assertEquals("Role is required to log in.", resp.getMessage());
        verify(userRepository, never()).findByEmail(any());
    }

    // ── verifyLoginOtp — TOTP not configured ─────────────────────

    @Test
    @DisplayName("verifyLoginOtp() — null totpSecret returns 'TOTP not set up' message")
    void verifyLoginOtp_nullTotpSecret_returnsError() {
        User user = buildUser("u@test.com", Role.CLIENT);
        user.setTotpSecret(null);
        when(userRepository.findByEmail("u@test.com")).thenReturn(Optional.of(user));

        AuthResponse resp = authService.verifyLoginOtp("u@test.com", "123456", "CLIENT");
        assertTrue(resp.getMessage().contains("TOTP not set up"));
        assertNull(resp.getToken());
    }

    // ── verifyLoginOtp — issues refresh token ────────────────────

    @Test
    @DisplayName("verifyLoginOtp() — valid OTP issues both access and refresh tokens")
    void verifyLoginOtp_validOtp_issuesBothTokens() {
        User user = buildUser("u@test.com", Role.CLIENT);
        when(userRepository.findByEmail("u@test.com")).thenReturn(Optional.of(user));
        when(otpService.verifyCode(any(), any())).thenReturn(true);
        when(jwtService.generateToken(any(User.class), any(Role.class))).thenReturn("access.token");
        when(tokenRefreshService.issueTokenPair(any(), any()))
                .thenReturn(new TokenPair("access.token", "refresh.token.xyz"));
        when(userRepository.save(any())).thenReturn(user);

        AuthResponse resp = authService.verifyLoginOtp("u@test.com", "123456", "CLIENT");

        assertEquals("access.token", resp.getToken());
        assertEquals("refresh.token.xyz", resp.getRefreshToken());
        assertEquals("CLIENT", resp.getRole());
    }

    // ── getAllUsers ───────────────────────────────────────────────

    @Test
    @DisplayName("getAllUsers() returns all users from repository")
    void getAllUsers_returnsAllUsers() {
        List<User> users = List.of(
                buildUser("a@test.com", Role.CLIENT),
                buildUser("b@test.com", Role.FREELANCER)
        );
        when(userRepository.findAll()).thenReturn(users);

        List<User> result = authService.getAllUsers();
        assertEquals(2, result.size());
    }

    @Test
    @DisplayName("getAllUsers() returns empty list when no users exist")
    void getAllUsers_emptyRepository_returnsEmptyList() {
        when(userRepository.findAll()).thenReturn(Collections.emptyList());
        assertTrue(authService.getAllUsers().isEmpty());
    }

    // ── registerAdmin — existing email adds ADMIN role ────────────

    @Test
    @DisplayName("registerAdmin() — existing email without ADMIN role adds admin role")
    void registerAdmin_existingEmailWithoutAdminRole_addsAdminRole() {
        User existing = buildUser("multi@test.com", Role.CLIENT);
        when(userRepository.findByEmail("multi@test.com")).thenReturn(Optional.of(existing));
        when(passwordEncoder.encode(any())).thenReturn("encoded_admin");
        when(userRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        AdminRegRequest req = new AdminRegRequest();
        req.setAdminCode("ADMIN-CODE-2024"); req.setEmail("multi@test.com");
        req.setPassword("AdminPass1"); req.setFullName("Multi"); req.setDepartment("IT");

        AuthResponse resp = authService.registerAdmin(req);
        assertEquals("ADMIN", resp.getRole());
        assertTrue(resp.getMessage().contains("Admin account created"));
    }

    // ── login — 1st and 2nd failed attempts show remaining count ──

    @Test
    @DisplayName("login() — 1st wrong password shows '2 attempt(s) remaining'")
    void login_firstWrongPassword_shows2Remaining() {
        User user = buildUser("u@test.com", Role.CLIENT);
        when(userRepository.findByEmail("u@test.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches(any(), any())).thenReturn(false);
        when(userRepository.save(any())).thenReturn(user);

        LoginRequest req = new LoginRequest();
        req.setEmail("u@test.com"); req.setPassword("Wrong"); req.setRole("CLIENT");

        AuthResponse resp = authService.login(req);
        assertTrue(resp.getMessage().contains("2 attempt(s) remaining"));
    }

    @Test
    @DisplayName("login() — 2nd wrong password shows '1 attempt(s) remaining'")
    void login_secondWrongPassword_shows1Remaining() {
        User user = buildUser("u@test.com", Role.CLIENT);
        user.setFailedLoginAttempts(1);
        when(userRepository.findByEmail("u@test.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches(any(), any())).thenReturn(false);
        when(userRepository.save(any())).thenReturn(user);

        LoginRequest req = new LoginRequest();
        req.setEmail("u@test.com"); req.setPassword("Wrong"); req.setRole("CLIENT");

        AuthResponse resp = authService.login(req);
        assertTrue(resp.getMessage().contains("1 attempt(s) remaining"));
    }

    // ── verifyLoginOtp — FREELANCER and ADMIN login emails ────────

    @Test
    @DisplayName("verifyLoginOtp() — FREELANCER role sends freelancer login email")
    void verifyLoginOtp_freelancerRole_sendsFreelancerEmail() {
        User user = buildUser("fl@test.com", Role.FREELANCER);
        when(userRepository.findByEmail("fl@test.com")).thenReturn(Optional.of(user));
        when(otpService.verifyCode(any(), any())).thenReturn(true);
        when(jwtService.generateToken(any(User.class), any(Role.class))).thenReturn("jwt");
        when(tokenRefreshService.issueTokenPair(any(), any()))
                .thenReturn(new TokenPair("jwt", "refresh"));
        when(userRepository.save(any())).thenReturn(user);

        authService.verifyLoginOtp("fl@test.com", "123456", "FREELANCER");
        verify(emailService).sendFreelancerLoginEmail(eq("fl@test.com"), any());
    }

    @Test
    @DisplayName("verifyLoginOtp() — ADMIN role sends admin login email")
    void verifyLoginOtp_adminRole_sendsAdminEmail() {
        User user = buildUser("admin@test.com", Role.ADMIN);
        when(userRepository.findByEmail("admin@test.com")).thenReturn(Optional.of(user));
        when(otpService.verifyCode(any(), any())).thenReturn(true);
        when(jwtService.generateToken(any(User.class), any(Role.class))).thenReturn("jwt");
        when(tokenRefreshService.issueTokenPair(any(), any()))
                .thenReturn(new TokenPair("jwt", "refresh"));
        when(userRepository.save(any())).thenReturn(user);

        authService.verifyLoginOtp("admin@test.com", "123456", "ADMIN");
        verify(emailService).sendAdminLoginEmail(eq("admin@test.com"), any());
    }
}
