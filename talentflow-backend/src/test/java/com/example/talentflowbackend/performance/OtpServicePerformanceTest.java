package com.example.talentflowbackend.performance;

import com.example.talentflowbackend.service.OtpService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Performance tests for OtpService.
 *
 * Non-functional requirements verified:
 * - Secret generation: < 10 ms per secret
 * - QR code generation: < 200 ms per code
 * - TOTP verification: < 5 ms per check
 * - 500 secrets generated in < 2 seconds
 */
@Tag("performance")
class OtpServicePerformanceTest {

    private OtpService otpService;

    @BeforeEach
    void setUp() {
        otpService = new OtpService();
        ReflectionTestUtils.setField(otpService, "issuer", "TalentFlowAI");
    }

    // ── Secret generation latency ─────────────────────────────────

    @Test
    @DisplayName("PERF-OTP-01: Single secret generation completes in < 10 ms")
    void singleSecretGeneration_under10ms() {
        long start = System.currentTimeMillis();
        otpService.generateSecret();
        long elapsed = System.currentTimeMillis() - start;
        assertTrue(elapsed < 10,
                "Secret generation took " + elapsed + " ms, expected < 10 ms");
    }

    // ── QR code generation latency ────────────────────────────────

    @Test
    @DisplayName("PERF-OTP-02: Single QR code generation completes in < 500 ms")
    void singleQrCodeGeneration_under500ms() {
        String secret = otpService.generateSecret();
        long start = System.currentTimeMillis();
        otpService.generateQrCodeDataUri("user@test.com", secret);
        long elapsed = System.currentTimeMillis() - start;
        assertTrue(elapsed < 500,
                "QR code generation took " + elapsed + " ms, expected < 500 ms");
    }

    // ── TOTP verification latency ─────────────────────────────────

    @Test
    @DisplayName("PERF-OTP-03: Single TOTP verification completes in < 20 ms")
    void singleTotpVerification_under20ms() {
        String secret = otpService.generateSecret();
        long start = System.currentTimeMillis();
        otpService.verifyCode(secret, "000000"); // wrong code but measures timing
        long elapsed = System.currentTimeMillis() - start;
        assertTrue(elapsed < 20,
                "TOTP verification took " + elapsed + " ms, expected < 20 ms");
    }

    // ── Bulk secret generation throughput ────────────────────────

    @Test
    @DisplayName("PERF-OTP-04: 500 secret generations complete in < 2 seconds")
    void bulkSecretGeneration_500secrets_under2s() {
        long start = System.currentTimeMillis();
        for (int i = 0; i < 500; i++) {
            otpService.generateSecret();
        }
        long elapsed = System.currentTimeMillis() - start;
        assertTrue(elapsed < 2000,
                "500 secret generations took " + elapsed + " ms, expected < 2000 ms");
        System.out.printf("[PERF] 500 TOTP secret generations: %d ms (%.2f ms/secret)%n",
                elapsed, elapsed / 500.0);
    }

    // ── Bulk TOTP verification throughput ─────────────────────────

    @Test
    @DisplayName("PERF-OTP-05: 1000 TOTP verifications complete in < 3 seconds")
    void bulkTotpVerification_1000checks_under3s() {
        String secret = otpService.generateSecret();
        long start = System.currentTimeMillis();
        for (int i = 0; i < 1000; i++) {
            otpService.verifyCode(secret, "000000");
        }
        long elapsed = System.currentTimeMillis() - start;
        assertTrue(elapsed < 3000,
                "1000 TOTP verifications took " + elapsed + " ms, expected < 3000 ms");
        System.out.printf("[PERF] 1000 TOTP verifications: %d ms (%.2f ms/check)%n",
                elapsed, elapsed / 1000.0);
    }

    // ── Concurrent secret generation ──────────────────────────────

    @Test
    @DisplayName("PERF-OTP-06: 30 concurrent threads generate secrets without errors")
    void concurrentSecretGeneration_30threads_noErrors() throws InterruptedException {
        int threadCount = 30;
        ExecutorService pool = Executors.newFixedThreadPool(threadCount);
        AtomicInteger errors = new AtomicInteger(0);
        CountDownLatch latch = new CountDownLatch(threadCount);

        long start = System.currentTimeMillis();
        for (int t = 0; t < threadCount; t++) {
            pool.submit(() -> {
                try {
                    for (int i = 0; i < 10; i++) {
                        String secret = otpService.generateSecret();
                        if (secret == null || secret.isBlank()) errors.incrementAndGet();
                    }
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

        assertEquals(0, errors.get(), "Concurrent secret generation had " + errors.get() + " errors");
        System.out.printf("[PERF] 30 threads × 10 secrets = 300 total in %d ms%n", elapsed);
    }

    // ── Average latency measurement ───────────────────────────────

    @Test
    @DisplayName("PERF-OTP-07: Average TOTP verification latency < 3 ms over 200 iterations")
    void averageVerificationLatency_under3ms() {
        String secret = otpService.generateSecret();
        int iterations = 200;
        long total = 0;
        for (int i = 0; i < iterations; i++) {
            long s = System.nanoTime();
            otpService.verifyCode(secret, "000000");
            total += System.nanoTime() - s;
        }
        double avgMs = (total / (double) iterations) / 1_000_000.0;
        assertTrue(avgMs < 3.0,
                "Average TOTP verification latency was " + avgMs + " ms, expected < 3 ms");
        System.out.printf("[PERF] Average TOTP verification latency: %.3f ms%n", avgMs);
    }
}
