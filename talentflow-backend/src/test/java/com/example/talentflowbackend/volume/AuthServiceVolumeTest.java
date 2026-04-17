package com.example.talentflowbackend.volume;

import com.example.talentflowbackend.dto.*;
import com.example.talentflowbackend.entity.Role;
import com.example.talentflowbackend.entity.User;
import com.example.talentflowbackend.repository.UserRepository;
import com.example.talentflowbackend.service.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * Volume tests for AuthService.
 *
 * Verifies correctness when processing large volumes of:
 * - Login attempts (wrong credentials)
 * - Registration requests
 * - OTP verification attempts
 * - getAllUsers with large result sets
 */
@Tag("volume")
class AuthServiceVolumeTest {

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
        ReflectionTestUtils.setField(authService, "adminRegistrationCode", "ADMIN-CODE");
    }

    // ── VOL-AUTH-01: 1,000 login attempts for non-existent users ──

    @Test
    @DisplayName("VOL-AUTH-01: 1,000 login attempts for non-existent users — all return error, none throw")
    void login1000NonExistentUsers_allReturnError() {
        when(userRepository.findByEmail(any())).thenReturn(Optional.empty());

        int errors = 0;
        int exceptions = 0;
        for (int i = 0; i < 1_000; i++) {
            try {
                LoginRequest req = new LoginRequest();
                req.setEmail("ghost" + i + "@test.com");
                req.setPassword("Pass1!");
                req.setRole("CLIENT");
                AuthResponse resp = authService.login(req);
                if (resp == null || resp.getMessage() == null) errors++;
            } catch (Exception e) {
                exceptions++;
            }
        }
        assertEquals(0, exceptions, exceptions + " exceptions thrown");
        assertEquals(0, errors, errors + " null responses");
        System.out.printf("[VOL] 1,000 login attempts (non-existent): 0 exceptions, 0 null responses%n");
    }

    // ── VOL-AUTH-02: 500 registrations — all return non-null response

    @Test
    @DisplayName("VOL-AUTH-02: 500 client registrations — all return non-null response with message")
    void register500Clients_allReturnNonNull() {
        when(userRepository.findByEmail(any())).thenReturn(Optional.empty());
        when(otpService.generateSecret()).thenReturn("SECRET");
        when(otpService.generateQrCodeDataUri(any(), any())).thenReturn("data:image/png;base64,abc");
        when(userRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        doNothing().when(emailService).sendClientRegistrationEmail(any(), any());

        int nullResponses = 0;
        for (int i = 0; i < 500; i++) {
            ClientRegRequest req = new ClientRegRequest();
            req.setFullName("User " + i);
            req.setEmail("vol" + i + "@test.com");
            req.setPassword("Pass1!");
            AuthResponse resp = authService.registerClient(req);
            if (resp == null || resp.getMessage() == null) nullResponses++;
        }
        assertEquals(0, nullResponses, nullResponses + " null responses out of 500");
        System.out.printf("[VOL] 500 client registrations: 0 null responses%n");
    }

    // ── VOL-AUTH-03: 1,000 OTP verifications — all return response ─

    @Test
    @DisplayName("VOL-AUTH-03: 1,000 OTP verifications for non-existent users — all return error message")
    void verifyOtp1000NonExistentUsers_allReturnError() {
        when(userRepository.findByEmail(any())).thenReturn(Optional.empty());

        int nullResponses = 0;
        int exceptions = 0;
        for (int i = 0; i < 1_000; i++) {
            try {
                AuthResponse resp = authService.verifyLoginOtp(
                        "ghost" + i + "@test.com", "123456", "CLIENT");
                if (resp == null || resp.getMessage() == null) nullResponses++;
            } catch (Exception e) {
                exceptions++;
            }
        }
        assertEquals(0, exceptions, exceptions + " exceptions thrown");
        assertEquals(0, nullResponses, nullResponses + " null responses");
        System.out.printf("[VOL] 1,000 OTP verifications (non-existent): 0 exceptions%n");
    }

    // ── VOL-AUTH-04: getAllUsers with 10,000 users ─────────────────

    @Test
    @DisplayName("VOL-AUTH-04: getAllUsers with 10,000 users returns all without error")
    void getAllUsers_10000Users_returnsAll() {
        List<User> largeList = new ArrayList<>();
        for (int i = 0; i < 10_000; i++) {
            largeList.add(User.builder()
                    .id("id-" + i).email("user" + i + "@test.com")
                    .fullName("User " + i).isActive(true)
                    .roles(new HashSet<>(Set.of(Role.CLIENT))).build());
        }
        when(userRepository.findAll()).thenReturn(largeList);

        List<User> result = authService.getAllUsers();

        assertEquals(10_000, result.size());
        System.out.printf("[VOL] getAllUsers with 10,000 users: returned %d%n", result.size());
    }

    // ── VOL-AUTH-05: 200 freelancer registrations ─────────────────

    @Test
    @DisplayName("VOL-AUTH-05: 200 freelancer registrations — all return FREELANCER role")
    void register200Freelancers_allReturnFreelancerRole() {
        when(userRepository.findByEmail(any())).thenReturn(Optional.empty());
        when(otpService.generateSecret()).thenReturn("SECRET");
        when(otpService.generateQrCodeDataUri(any(), any())).thenReturn("data:image/png;base64,abc");
        when(userRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        doNothing().when(emailService).sendFreelancerRegistrationEmail(any(), any());

        int wrongRole = 0;
        for (int i = 0; i < 200; i++) {
            FreelancerRegRequest req = new FreelancerRegRequest();
            req.setFullName("FL " + i);
            req.setEmail("fl" + i + "@test.com");
            req.setPassword("Pass1!");
            AuthResponse resp = authService.registerFreelancer(req);
            if (!"FREELANCER".equals(resp.getRole())) wrongRole++;
        }
        assertEquals(0, wrongRole, wrongRole + " registrations returned wrong role");
        System.out.printf("[VOL] 200 freelancer registrations: 0 wrong roles%n");
    }

    // ── VOL-AUTH-06: 500 login attempts with wrong role ───────────

    @Test
    @DisplayName("VOL-AUTH-06: 500 login attempts with wrong role — all return 'no account' message")
    void login500WrongRole_allReturnNoAccountMessage() {
        User clientUser = User.builder()
                .id("uid-1").email("client@test.com").fullName("Client")
                .clientPassword(passwordEncoder.encode("Pass1!"))
                .roles(new HashSet<>(Set.of(Role.CLIENT)))
                .isActive(true).failedLoginAttempts(0).build();

        when(userRepository.findByEmail("client@test.com")).thenReturn(Optional.of(clientUser));

        int wrongMessages = 0;
        for (int i = 0; i < 500; i++) {
            // Reset attempts to avoid lockout
            clientUser.setFailedLoginAttempts(0);
            clientUser.setLockedUntil(null);

            LoginRequest req = new LoginRequest();
            req.setEmail("client@test.com");
            req.setPassword("Pass1!");
            req.setRole("FREELANCER"); // wrong role
            AuthResponse resp = authService.login(req);
            if (!resp.getMessage().contains("No FREELANCER account found")) wrongMessages++;
        }
        assertEquals(0, wrongMessages, wrongMessages + " responses had wrong message");
        System.out.printf("[VOL] 500 login attempts (wrong role): 0 wrong messages%n");
    }
}
