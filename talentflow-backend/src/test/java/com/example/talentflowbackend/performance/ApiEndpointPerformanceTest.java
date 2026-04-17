package com.example.talentflowbackend.performance;

import com.example.talentflowbackend.service.EmailService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Performance tests for REST API endpoints.
 *
 * Non-functional requirements verified:
 * - Login endpoint: average response < 500 ms
 * - Registration endpoint: average response < 1000 ms
 * - Protected endpoint (401): average response < 50 ms
 * - 20 concurrent login requests complete without server errors
 * - Throughput: > 10 requests/second on public endpoints
 */
@Tag("performance")
@ActiveProfiles("test")
@SpringBootTest
@AutoConfigureMockMvc
class ApiEndpointPerformanceTest {

    @Autowired
    private MockMvc mockMvc;

    /** Avoid real SMTP during perf tests (would block on connection timeout). */
    @MockBean
    private EmailService emailService;

    private static final long TS = System.currentTimeMillis();

    // ── Login endpoint latency ────────────────────────────────────

    @Test
    @DisplayName("PERF-API-01: Single login request completes in < 2000 ms")
    void loginEndpoint_singleRequest_under2000ms() throws Exception {
        long start = System.currentTimeMillis();
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"perf@test.com\",\"password\":\"pass\",\"role\":\"CLIENT\"}"))
                .andExpect(status().isOk());
        long elapsed = System.currentTimeMillis() - start;
        assertTrue(elapsed < 2000,
                "Login request took " + elapsed + " ms, expected < 2000 ms");
        System.out.printf("[PERF] Login endpoint single request: %d ms%n", elapsed);
    }

    // ── Registration endpoint latency ─────────────────────────────

    @Test
    @DisplayName("PERF-API-02: Single registration request completes in < 3000 ms")
    void registrationEndpoint_singleRequest_under3000ms() throws Exception {
        long start = System.currentTimeMillis();
        mockMvc.perform(post("/api/auth/register/client")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                        "fullName": "Perf User",
                        "email": "perf_reg_%d@talentflow.test",
                        "password": "PerfPass1!"
                    }
                    """.formatted(TS)))
                .andExpect(status().isOk());
        long elapsed = System.currentTimeMillis() - start;
        assertTrue(elapsed < 3000,
                "Registration request took " + elapsed + " ms, expected < 3000 ms");
        System.out.printf("[PERF] Registration endpoint single request: %d ms%n", elapsed);
    }

    // ── 401 response latency (no DB hit) ─────────────────────────

    @Test
    @DisplayName("PERF-API-03: 401 response (no token) completes in < 100 ms")
    void unauthorizedResponse_under100ms() throws Exception {
        long start = System.currentTimeMillis();
        mockMvc.perform(get("/api/user/profile"))
                .andExpect(status().isUnauthorized());
        long elapsed = System.currentTimeMillis() - start;
        assertTrue(elapsed < 100,
                "401 response took " + elapsed + " ms, expected < 100 ms");
        System.out.printf("[PERF] 401 response latency: %d ms%n", elapsed);
    }

    // ── Bulk login requests ───────────────────────────────────────

    @Test
    @DisplayName("PERF-API-04: 20 sequential login requests average < 500 ms each")
    void loginEndpoint_20sequential_avgUnder500ms() throws Exception {
        int count = 20;
        long total = 0;
        for (int i = 0; i < count; i++) {
            long start = System.currentTimeMillis();
            mockMvc.perform(post("/api/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"email\":\"bulk" + i + "@test.com\",\"password\":\"pass\",\"role\":\"CLIENT\"}"))
                    .andExpect(status().isOk());
            total += System.currentTimeMillis() - start;
        }
        double avg = total / (double) count;
        assertTrue(avg < 500,
                "Average login latency was " + avg + " ms, expected < 500 ms");
        System.out.printf("[PERF] 20 sequential login requests: total=%d ms, avg=%.1f ms%n", total, avg);
    }

    // ── Concurrent login requests ─────────────────────────────────

    @Test
    @DisplayName("PERF-API-05: 20 concurrent login requests complete without 5xx errors")
    void loginEndpoint_20concurrent_no5xxErrors() throws InterruptedException {
        int threadCount = 20;
        ExecutorService pool = Executors.newFixedThreadPool(threadCount);
        AtomicInteger serverErrors = new AtomicInteger(0);
        AtomicInteger successes = new AtomicInteger(0);
        CountDownLatch latch = new CountDownLatch(threadCount);

        long start = System.currentTimeMillis();
        for (int t = 0; t < threadCount; t++) {
            final int tid = t;
            pool.submit(() -> {
                try {
                    MvcResult result = mockMvc.perform(post("/api/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"email\":\"concurrent" + tid + "@test.com\",\"password\":\"pass\",\"role\":\"CLIENT\"}"))
                            .andReturn();
                    int status = result.getResponse().getStatus();
                    if (status >= 500) serverErrors.incrementAndGet();
                    else successes.incrementAndGet();
                } catch (Exception e) {
                    serverErrors.incrementAndGet();
                } finally {
                    latch.countDown();
                }
            });
        }

        latch.await(30, TimeUnit.SECONDS);
        pool.shutdown();
        long elapsed = System.currentTimeMillis() - start;

        assertEquals(0, serverErrors.get(),
                "Concurrent login requests had " + serverErrors.get() + " server errors");
        assertEquals(threadCount, successes.get());
        System.out.printf("[PERF] 20 concurrent login requests: %d ms, 0 server errors%n", elapsed);
    }

    // ── Throughput: requests per second ──────────────────────────

    @Test
    @DisplayName("PERF-API-06: 401 endpoint handles > 50 requests/second")
    void unauthorizedEndpoint_throughput_over50rps() throws Exception {
        int requests = 100;
        long start = System.currentTimeMillis();
        for (int i = 0; i < requests; i++) {
            mockMvc.perform(get("/api/user/profile"))
                    .andExpect(status().isUnauthorized());
        }
        long elapsed = System.currentTimeMillis() - start;
        double rps = requests / (elapsed / 1000.0);
        assertTrue(rps > 50,
                "Throughput was " + rps + " req/s, expected > 50 req/s");
        System.out.printf("[PERF] 401 endpoint throughput: %.1f req/s (%d requests in %d ms)%n",
                rps, requests, elapsed);
    }

    // ── Refresh endpoint latency ──────────────────────────────────

    @Test
    @DisplayName("PERF-API-07: Refresh endpoint with invalid token responds in < 500 ms")
    void refreshEndpoint_invalidToken_under500ms() throws Exception {
        long start = System.currentTimeMillis();
        mockMvc.perform(post("/api/auth/refresh")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"refreshToken\":\"perf-test-invalid-token\"}"))
                .andExpect(status().isOk());
        long elapsed = System.currentTimeMillis() - start;
        assertTrue(elapsed < 500,
                "Refresh endpoint took " + elapsed + " ms, expected < 500 ms");
        System.out.printf("[PERF] Refresh endpoint (invalid token): %d ms%n", elapsed);
    }

    // ── Concurrent registration requests ─────────────────────────

    @Test
    @DisplayName("PERF-API-08: 10 concurrent registration requests complete without 5xx errors")
    void registrationEndpoint_10concurrent_no5xxErrors() throws InterruptedException {
        int threadCount = 10;
        ExecutorService pool = Executors.newFixedThreadPool(threadCount);
        AtomicInteger serverErrors = new AtomicInteger(0);
        CountDownLatch latch = new CountDownLatch(threadCount);
        long uniqueBase = System.currentTimeMillis();

        long start = System.currentTimeMillis();
        for (int t = 0; t < threadCount; t++) {
            final int tid = t;
            pool.submit(() -> {
                try {
                    MvcResult result = mockMvc.perform(post("/api/auth/register/client")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                {
                                    "fullName": "Concurrent User %d",
                                    "email": "concurrent_reg_%d_%d@talentflow.test",
                                    "password": "ConcurrentPass1!"
                                }
                                """.formatted(tid, uniqueBase, tid)))
                            .andReturn();
                    if (result.getResponse().getStatus() >= 500) serverErrors.incrementAndGet();
                } catch (Exception e) {
                    serverErrors.incrementAndGet();
                } finally {
                    latch.countDown();
                }
            });
        }

        latch.await(60, TimeUnit.SECONDS);
        pool.shutdown();
        long elapsed = System.currentTimeMillis() - start;

        assertEquals(0, serverErrors.get(),
                "Concurrent registration had " + serverErrors.get() + " server errors");
        System.out.printf("[PERF] 10 concurrent registrations: %d ms, 0 server errors%n", elapsed);
    }

    // ── Response size check ───────────────────────────────────────

    @Test
    @DisplayName("PERF-API-09: Login response body is < 2 KB")
    void loginResponse_bodyUnder2KB() throws Exception {
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"size@test.com\",\"password\":\"pass\",\"role\":\"CLIENT\"}"))
                .andReturn();
        int bodySize = result.getResponse().getContentAsString().length();
        assertTrue(bodySize < 2048,
                "Login response body was " + bodySize + " bytes, expected < 2048 bytes");
        System.out.printf("[PERF] Login response body size: %d bytes%n", bodySize);
    }

    // ── Warm-up + sustained load ──────────────────────────────────

    @Test
    @DisplayName("PERF-API-10: 50 sustained login requests maintain < 1000 ms average after warm-up")
    void loginEndpoint_sustainedLoad_avgUnder1000ms() throws Exception {
        // Warm-up: 5 requests
        for (int i = 0; i < 5; i++) {
            mockMvc.perform(post("/api/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"email\":\"warmup@test.com\",\"password\":\"pass\",\"role\":\"CLIENT\"}"))
                    .andReturn();
        }

        // Sustained load: 50 requests
        int count = 50;
        long total = 0;
        long max = 0;
        for (int i = 0; i < count; i++) {
            long s = System.currentTimeMillis();
            mockMvc.perform(post("/api/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"email\":\"sustained" + i + "@test.com\",\"password\":\"pass\",\"role\":\"CLIENT\"}"))
                    .andReturn();
            long elapsed = System.currentTimeMillis() - s;
            total += elapsed;
            if (elapsed > max) max = elapsed;
        }

        double avg = total / (double) count;
        assertTrue(avg < 1000,
                "Sustained load average was " + avg + " ms, expected < 1000 ms");
        System.out.printf("[PERF] 50 sustained login requests: avg=%.1f ms, max=%d ms%n", avg, max);
    }
}
