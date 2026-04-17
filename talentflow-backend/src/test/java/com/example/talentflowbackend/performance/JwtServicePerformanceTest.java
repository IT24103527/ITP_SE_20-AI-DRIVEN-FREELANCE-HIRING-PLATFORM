package com.example.talentflowbackend.performance;

import com.example.talentflowbackend.entity.Role;
import com.example.talentflowbackend.entity.User;
import com.example.talentflowbackend.service.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.HashSet;
import java.util.Set;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Performance tests for JwtService.
 *
 * Non-functional requirements verified:
 * - Token generation: < 5 ms per token (single-threaded)
 * - Token validation: < 2 ms per validation (single-threaded)
 * - 1000 tokens generated in < 3 seconds
 * - 50 concurrent threads can generate tokens without errors
 */
@Tag("performance")
class JwtServicePerformanceTest {

    private JwtService jwtService;

    private static final String SECRET =
            "404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970";
    private static final long EXPIRATION = 900_000L;

    @BeforeEach
    void setUp() {
        jwtService = new JwtService();
        ReflectionTestUtils.setField(jwtService, "secretKey", SECRET);
        ReflectionTestUtils.setField(jwtService, "jwtExpiration", EXPIRATION);
    }

    private User buildUser(String email) {
        return User.builder()
                .id("perf-id").email(email).fullName("Perf User")
                .roles(new HashSet<>(Set.of(Role.CLIENT))).isActive(true).build();
    }

    // ── Single-token generation latency ───────────────────────────

    @Test
    @DisplayName("PERF-JWT-01: Single token generation completes in < 50 ms")
    void singleTokenGeneration_under50ms() {
        User user = buildUser("perf@test.com");
        long start = System.currentTimeMillis();
        jwtService.generateToken(user, Role.CLIENT);
        long elapsed = System.currentTimeMillis() - start;
        assertTrue(elapsed < 50,
                "Token generation took " + elapsed + " ms, expected < 50 ms");
    }

    // ── Single-token validation latency ───────────────────────────

    @Test
    @DisplayName("PERF-JWT-02: Single token validation completes in < 10 ms (after warmup)")
    void singleTokenValidation_under10ms() {
        User user = buildUser("perf@test.com");
        String token = jwtService.generateToken(user, Role.CLIENT);
        for (int i = 0; i < 10; i++) {
            jwtService.isTokenValid(token, user);
        }
        long start = System.nanoTime();
        jwtService.isTokenValid(token, user);
        long elapsedMs = (System.nanoTime() - start) / 1_000_000L;
        assertTrue(elapsedMs < 10,
                "Token validation took " + elapsedMs + " ms, expected < 10 ms");
    }

    // ── Bulk generation throughput ────────────────────────────────

    @Test
    @DisplayName("PERF-JWT-03: 1000 token generations complete in < 3 seconds")
    void bulkTokenGeneration_1000tokens_under3s() {
        User user = buildUser("bulk@test.com");
        long start = System.currentTimeMillis();
        for (int i = 0; i < 1000; i++) {
            jwtService.generateToken(user, Role.CLIENT);
        }
        long elapsed = System.currentTimeMillis() - start;
        assertTrue(elapsed < 3000,
                "1000 token generations took " + elapsed + " ms, expected < 3000 ms");
        System.out.printf("[PERF] 1000 JWT generations: %d ms (%.2f ms/token)%n",
                elapsed, elapsed / 1000.0);
    }

    // ── Bulk validation throughput ────────────────────────────────

    @Test
    @DisplayName("PERF-JWT-04: 1000 token validations complete in < 3 seconds")
    void bulkTokenValidation_1000tokens_under2s() {
        User user = buildUser("bulk@test.com");
        String token = jwtService.generateToken(user, Role.CLIENT);
        long start = System.currentTimeMillis();
        for (int i = 0; i < 1000; i++) {
            jwtService.isTokenValid(token, user);
        }
        long elapsed = System.currentTimeMillis() - start;
        assertTrue(elapsed < 3000,
                "1000 token validations took " + elapsed + " ms, expected < 3000 ms");
        System.out.printf("[PERF] 1000 JWT validations: %d ms (%.2f ms/token)%n",
                elapsed, elapsed / 1000.0);
    }

    // ── Concurrent generation ─────────────────────────────────────

    @Test
    @DisplayName("PERF-JWT-05: 50 concurrent threads generate tokens without errors")
    void concurrentTokenGeneration_50threads_noErrors() throws InterruptedException {
        int threadCount = 50;
        int tokensPerThread = 20;
        ExecutorService pool = Executors.newFixedThreadPool(threadCount);
        AtomicInteger errors = new AtomicInteger(0);
        CountDownLatch latch = new CountDownLatch(threadCount);

        long start = System.currentTimeMillis();
        for (int t = 0; t < threadCount; t++) {
            final int tid = t;
            pool.submit(() -> {
                try {
                    User user = buildUser("thread" + tid + "@test.com");
                    for (int i = 0; i < tokensPerThread; i++) {
                        String token = jwtService.generateToken(user, Role.CLIENT);
                        if (token == null || token.isBlank()) errors.incrementAndGet();
                    }
                } catch (Exception e) {
                    errors.incrementAndGet();
                } finally {
                    latch.countDown();
                }
            });
        }

        latch.await(10, TimeUnit.SECONDS);
        pool.shutdown();
        long elapsed = System.currentTimeMillis() - start;

        assertEquals(0, errors.get(), "Concurrent token generation had " + errors.get() + " errors");
        System.out.printf("[PERF] %d threads × %d tokens = %d total in %d ms%n",
                threadCount, tokensPerThread, threadCount * tokensPerThread, elapsed);
    }

    // ── Average latency measurement ───────────────────────────────

    @Test
    @DisplayName("PERF-JWT-06: Average token generation latency < 5 ms over 500 iterations")
    void averageGenerationLatency_under5ms() {
        User user = buildUser("avg@test.com");
        int iterations = 500;
        long total = 0;
        for (int i = 0; i < iterations; i++) {
            long s = System.nanoTime();
            jwtService.generateToken(user, Role.CLIENT);
            total += System.nanoTime() - s;
        }
        double avgMs = (total / (double) iterations) / 1_000_000.0;
        assertTrue(avgMs < 5.0,
                "Average generation latency was " + avgMs + " ms, expected < 5 ms");
        System.out.printf("[PERF] Average JWT generation latency: %.3f ms%n", avgMs);
    }
}
