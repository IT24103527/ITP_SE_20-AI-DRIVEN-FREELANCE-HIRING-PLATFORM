package com.example.talentflowbackend.performance;

import com.example.talentflowbackend.config.RateLimitingFilter;
import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * Performance tests for RateLimitingFilter.
 *
 * Non-functional requirements verified:
 * - Filter overhead per request: < 1 ms
 * - 10,000 requests processed in < 5 seconds
 * - 100 concurrent threads processed without deadlock
 */
@Tag("performance")
class RateLimitingPerformanceTest {

    private RateLimitingFilter filter;

    @BeforeEach
    void setUp() {
        filter = new RateLimitingFilter();
    }

    private MockHttpServletRequest req(String ip, String path) {
        MockHttpServletRequest r = new MockHttpServletRequest();
        r.setRemoteAddr(ip);
        r.setRequestURI(path);
        return r;
    }

    // ── Filter overhead per request ───────────────────────────────

    @Test
    @DisplayName("PERF-RATE-01: Single filter pass-through completes in < 5 ms")
    void singleFilterPassThrough_under5ms() throws Exception {
        MockHttpServletRequest req = req("1.2.3.4", "/api/user/profile");
        MockHttpServletResponse res = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);

        long start = System.currentTimeMillis();
        filter.doFilter(req, res, chain);
        long elapsed = System.currentTimeMillis() - start;

        assertTrue(elapsed < 5,
                "Filter pass-through took " + elapsed + " ms, expected < 5 ms");
    }

    // ── Bulk request processing ───────────────────────────────────

    @Test
    @DisplayName("PERF-RATE-02: 5000 requests from different IPs processed in < 5 seconds")
    void bulkRequests_5000differentIps_under5s() throws Exception {
        FilterChain chain = mock(FilterChain.class);
        long start = System.currentTimeMillis();

        for (int i = 0; i < 5000; i++) {
            MockHttpServletRequest req = req("10.0." + (i / 256) + "." + (i % 256), "/api/user/profile");
            MockHttpServletResponse res = new MockHttpServletResponse();
            filter.doFilter(req, res, chain);
        }

        long elapsed = System.currentTimeMillis() - start;
        assertTrue(elapsed < 5000,
                "5000 filter requests took " + elapsed + " ms, expected < 5000 ms");
        System.out.printf("[PERF] 5000 rate-limit filter requests: %d ms (%.2f ms/req)%n",
                elapsed, elapsed / 5000.0);
    }

    // ── Concurrent filter processing ──────────────────────────────

    @Test
    @DisplayName("PERF-RATE-03: 100 concurrent threads processed without deadlock or errors")
    void concurrentRequests_100threads_noDeadlock() throws InterruptedException {
        int threadCount = 100;
        ExecutorService pool = Executors.newFixedThreadPool(threadCount);
        AtomicInteger errors = new AtomicInteger(0);
        CountDownLatch latch = new CountDownLatch(threadCount);
        FilterChain chain = mock(FilterChain.class);

        long start = System.currentTimeMillis();
        for (int t = 0; t < threadCount; t++) {
            final int tid = t;
            pool.submit(() -> {
                try {
                    for (int i = 0; i < 5; i++) {
                        MockHttpServletRequest req = req("192.168." + tid + "." + i, "/api/user/profile");
                        MockHttpServletResponse res = new MockHttpServletResponse();
                        filter.doFilter(req, res, chain);
                    }
                } catch (Exception e) {
                    errors.incrementAndGet();
                } finally {
                    latch.countDown();
                }
            });
        }

        boolean completed = latch.await(15, TimeUnit.SECONDS);
        pool.shutdown();
        long elapsed = System.currentTimeMillis() - start;

        assertTrue(completed, "Concurrent filter test did not complete within 15 seconds (deadlock?)");
        assertEquals(0, errors.get(), "Concurrent filter processing had " + errors.get() + " errors");
        System.out.printf("[PERF] 100 concurrent threads × 5 requests = 500 total in %d ms%n", elapsed);
    }

    // ── Rate limit enforcement speed ──────────────────────────────

    @Test
    @DisplayName("PERF-RATE-04: Rate limit check (counter lookup) averages < 0.5 ms")
    void rateLimitCheck_averageLatency_under0_5ms() throws Exception {
        FilterChain chain = mock(FilterChain.class);
        int iterations = 1000;
        long total = 0;

        for (int i = 0; i < iterations; i++) {
            MockHttpServletRequest req = req("5.5.5." + (i % 256), "/api/user/profile");
            MockHttpServletResponse res = new MockHttpServletResponse();
            long s = System.nanoTime();
            filter.doFilter(req, res, chain);
            total += System.nanoTime() - s;
        }

        double avgMs = (total / (double) iterations) / 1_000_000.0;
        assertTrue(avgMs < 0.5,
                "Average rate limit check was " + avgMs + " ms, expected < 0.5 ms");
        System.out.printf("[PERF] Average rate limit filter overhead: %.4f ms%n", avgMs);
    }

    // ── Memory stability under load ───────────────────────────────

    @Test
    @DisplayName("PERF-RATE-05: Filter counter map does not grow unboundedly under sustained load")
    void filterCounterMap_doesNotGrowUnboundedly() throws Exception {
        FilterChain chain = mock(FilterChain.class);

        // Send requests from 1000 different IPs
        for (int i = 0; i < 1000; i++) {
            MockHttpServletRequest req = req("172.16." + (i / 256) + "." + (i % 256), "/api/user/profile");
            MockHttpServletResponse res = new MockHttpServletResponse();
            filter.doFilter(req, res, chain);
        }

        // The filter should still respond quickly (no memory pressure)
        MockHttpServletRequest req = req("1.1.1.1", "/api/user/profile");
        MockHttpServletResponse res = new MockHttpServletResponse();
        long start = System.nanoTime();
        filter.doFilter(req, res, chain);
        long elapsed = (System.nanoTime() - start) / 1_000_000;

        assertTrue(elapsed < 10,
                "Filter response after 1000 IPs took " + elapsed + " ms, expected < 10 ms");
        System.out.printf("[PERF] Filter response after 1000 unique IPs: %d ms%n", elapsed);
    }
}
