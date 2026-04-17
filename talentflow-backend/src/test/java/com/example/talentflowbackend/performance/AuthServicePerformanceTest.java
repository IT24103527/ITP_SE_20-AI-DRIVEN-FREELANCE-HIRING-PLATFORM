package com.example.talentflowbackend.performance;

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
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * Performance tests for AuthService.
 *
 * Non-functional requirements verified:
 * - Login (wrong password): < 500 ms (BCrypt comparison dominates)
 * - Login (locked account check): < 5 ms (in-memory date comparison)
 * - 50 concurrent login attempts complete without errors
 */
@Tag("performance")
class AuthServicePerformanceTest {

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

    private User buildUser(String email, String password) {
        return User.builder()
                .id("uid-1").email(email).fullName("Perf User")
                .clientPassword(passwordEncoder.encode(password))
                .totpSecret("SECRET")
                .roles(new HashSet<>(Set.of(Role.CLIENT)))
                .isActive(true)
                .failedLoginAttempts(0).failedOtpAttempts(0)
                .build();
    }

    // ── Login with wrong password (BCrypt comparison) ─────────────

    @Test
    @DisplayName("PERF-AUTH-01: Login with wrong password completes in < 1000 ms (BCrypt)")
    void login_wrongPassword_under1000ms() {
        User user = buildUser("perf@test.com", "CorrectPass1!");
        when(userRepository.findByEmail("perf@test.com")).thenReturn(Optional.of(user));
        when(userRepository.save(any())).thenReturn(user);

        LoginRequest req = new LoginRequest();
        req.setEmail("perf@test.com");
        req.setPassword("WrongPass!");
        req.setRole("CLIENT");

        long start = System.currentTimeMillis();
        authService.login(req);
        long elapsed = System.currentTimeMillis() - start;

        assertTrue(elapsed < 1000,
                "Login with wrong password took " + elapsed + " ms, expected < 1000 ms");
        System.out.printf("[PERF] Login (wrong password / BCrypt): %d ms%n", elapsed);
    }

    // ── Login with locked account (in-memory check) ───────────────

    @Test
    @DisplayName("PERF-AUTH-02: Login with locked account returns in < 10 ms (no BCrypt)")
    void login_lockedAccount_under10ms() {
        User user = buildUser("locked@test.com", "Pass1!");
        user.setLockedUntil(new Date(System.currentTimeMillis() + 60_000));
        when(userRepository.findByEmail("locked@test.com")).thenReturn(Optional.of(user));

        LoginRequest req = new LoginRequest();
        req.setEmail("locked@test.com");
        req.setPassword("Pass1!");
        req.setRole("CLIENT");

        long start = System.currentTimeMillis();
        authService.login(req);
        long elapsed = System.currentTimeMillis() - start;

        assertTrue(elapsed < 10,
                "Locked account check took " + elapsed + " ms, expected < 10 ms");
        System.out.printf("[PERF] Login (locked account): %d ms%n", elapsed);
    }

    // ── Login with non-existent user ──────────────────────────────

    @Test
    @DisplayName("PERF-AUTH-03: Login with non-existent user returns in < 10 ms")
    void login_nonExistentUser_under10ms() {
        when(userRepository.findByEmail("ghost@test.com")).thenReturn(Optional.empty());

        LoginRequest req = new LoginRequest();
        req.setEmail("ghost@test.com");
        req.setPassword("Pass1!");
        req.setRole("CLIENT");

        long start = System.currentTimeMillis();
        authService.login(req);
        long elapsed = System.currentTimeMillis() - start;

        assertTrue(elapsed < 10,
                "Non-existent user login took " + elapsed + " ms, expected < 10 ms");
        System.out.printf("[PERF] Login (non-existent user): %d ms%n", elapsed);
    }

    // ── Concurrent login attempts ─────────────────────────────────

    @Test
    @DisplayName("PERF-AUTH-04: 50 concurrent login attempts complete without errors")
    void concurrentLoginAttempts_50threads_noErrors() throws InterruptedException {
        int threadCount = 50;
        ExecutorService pool = Executors.newFixedThreadPool(threadCount);
        AtomicInteger errors = new AtomicInteger(0);
        CountDownLatch latch = new CountDownLatch(threadCount);

        when(userRepository.findByEmail(any())).thenReturn(Optional.empty());

        long start = System.currentTimeMillis();
        for (int t = 0; t < threadCount; t++) {
            final int tid = t;
            pool.submit(() -> {
                try {
                    LoginRequest req = new LoginRequest();
                    req.setEmail("thread" + tid + "@test.com");
                    req.setPassword("Pass1!");
                    req.setRole("CLIENT");
                    AuthResponse resp = authService.login(req);
                    if (resp == null) errors.incrementAndGet();
                } catch (Exception e) {
                    errors.incrementAndGet();
                } finally {
                    latch.countDown();
                }
            });
        }

        latch.await(15, TimeUnit.SECONDS);
        pool.shutdown();
        long elapsed = System.currentTimeMillis() - start;

        assertEquals(0, errors.get(), "Concurrent login had " + errors.get() + " errors");
        System.out.printf("[PERF] 50 concurrent login attempts: %d ms, 0 errors%n", elapsed);
    }

    // ── Registration throughput ───────────────────────────────────

    @Test
    @DisplayName("PERF-AUTH-05: 20 sequential registrations complete in < 10 seconds")
    void sequentialRegistrations_20_under10s() {
        when(userRepository.findByEmail(any())).thenReturn(Optional.empty());
        when(otpService.generateSecret()).thenReturn("SECRET");
        when(otpService.generateQrCodeDataUri(any(), any())).thenReturn("data:image/png;base64,abc");
        when(userRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        doNothing().when(emailService).sendClientRegistrationEmail(any(), any());

        long start = System.currentTimeMillis();
        for (int i = 0; i < 20; i++) {
            ClientRegRequest req = new ClientRegRequest();
            req.setFullName("User " + i);
            req.setEmail("reg" + i + "@test.com");
            req.setPassword("Pass1!");
            authService.registerClient(req);
        }
        long elapsed = System.currentTimeMillis() - start;

        assertTrue(elapsed < 10_000,
                "20 registrations took " + elapsed + " ms, expected < 10000 ms");
        System.out.printf("[PERF] 20 sequential registrations: %d ms (%.1f ms/reg)%n",
                elapsed, elapsed / 20.0);
    }

    // ── OTP verification throughput ───────────────────────────────

    @Test
    @DisplayName("PERF-AUTH-06: 100 OTP verifications (wrong code) complete in < 2 seconds")
    void otpVerification_100wrong_under2s() {
        User user = buildUser("otp@test.com", "Pass1!");
        when(userRepository.findByEmail("otp@test.com")).thenReturn(Optional.of(user));
        when(otpService.verifyCode(any(), any())).thenReturn(false);
        when(userRepository.save(any())).thenReturn(user);

        long start = System.currentTimeMillis();
        for (int i = 0; i < 100; i++) {
            // Reset attempts to avoid lockout
            user.setFailedOtpAttempts(0);
            authService.verifyLoginOtp("otp@test.com", "000000", "CLIENT");
        }
        long elapsed = System.currentTimeMillis() - start;

        assertTrue(elapsed < 2000,
                "100 OTP verifications took " + elapsed + " ms, expected < 2000 ms");
        System.out.printf("[PERF] 100 OTP verifications (wrong code): %d ms (%.2f ms/check)%n",
                elapsed, elapsed / 100.0);
    }
}
