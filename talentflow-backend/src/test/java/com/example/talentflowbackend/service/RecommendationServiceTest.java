package com.example.talentflowbackend.service;

import com.example.talentflowbackend.dto.FinalRecommendationResponse;
import com.example.talentflowbackend.dto.RecommendationAnalyticsDTO;
import com.example.talentflowbackend.dto.RecommendationResponse;
import com.example.talentflowbackend.entity.RecommendationHistory;
import com.example.talentflowbackend.entity.User;
import com.example.talentflowbackend.repository.RecommendationHistoryRepository;
import com.example.talentflowbackend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.web.client.RestTemplate;

import java.util.Collections;
import java.util.List;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.ArgumentMatchers.any;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.when;

class RecommendationServiceTest {

    @Mock
    private RestTemplate restTemplate;

    @Mock
    private UserRepository userRepository;

    @Mock
    private RecommendationHistoryRepository historyRepository;

    @Mock
    private JwtService jwtService;

    @InjectMocks
    private RecommendationService recommendationService;

    @BeforeEach
    void setup() {
        MockitoAnnotations.openMocks(this);
    }

    /* ─────────────────────────────────────
       TEST 1: getRecommendations SUCCESS
    ───────────────────────────────────── */
    @Test
    void testGetRecommendations_success() {

        // Mock freelancers from DB
        User f1 = new User();
        f1.setId("1");
        f1.setFullName("John Doe");
        f1.setSkills("React");

        when(userRepository.findAll()).thenReturn(List.of(f1));

        // Mock Flask response
        RecommendationResponse mockResponse = new RecommendationResponse();
        mockResponse.setFreelancer_id("1");
        mockResponse.setMatch_percentage(95.0);

        when(restTemplate.postForObject(
                anyString(),
                any(),
                eq(RecommendationResponse[].class)
        )).thenReturn(new RecommendationResponse[]{mockResponse});

        // Call method
        List<FinalRecommendationResponse> result =
                recommendationService.getRecommendations("React developer", "Bearer fake-token");

        // Assertions
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("John Doe", result.get(0).getName());
        assertEquals(95.0, result.get(0).getMatchPercentage());

        // Verify history saved
        verify(historyRepository, times(1)).save(any(RecommendationHistory.class));
    }

    /* ─────────────────────────────────────
       TEST 2: getRecommendations EMPTY RESPONSE
    ───────────────────────────────────── */
    @Test
    void testGetRecommendations_emptyFlaskResponse() {

        when(userRepository.findAll()).thenReturn(Collections.emptyList());

        when(restTemplate.postForObject(
                anyString(),
                any(),
                eq(RecommendationResponse[].class)
        )).thenReturn(null);

        List<FinalRecommendationResponse> result =
                recommendationService.getRecommendations("Java", "Bearer fake-token");

        assertNotNull(result);
        assertEquals(0, result.size());
    }



    /* ─────────────────────────────────────
       TEST 4: getAnalytics EMPTY DATA
    ───────────────────────────────────── */
    @Test
    void testGetAnalytics_empty() {

        when(historyRepository.findAll())
                .thenReturn(Collections.emptyList());

        RecommendationAnalyticsDTO result =
                recommendationService.getAnalytics("Bearer fake-token");

        assertNotNull(result);
        assertEquals(0, result.getTotalRecommendations());
        assertEquals(0.0, result.getAverageMatchScore());
        assertTrue(result.getTopFreelancers().isEmpty());
    }

    /* ─────────────────────────────────────
       TEST 5: NULL SAFETY (IMPORTANT BUG FIX TEST)
    ───────────────────────────────────── */
    @Test
    void testGetAnalytics_nullFreelancerName() {

        RecommendationHistory h1 = new RecommendationHistory();
        com.example.talentflowbackend.entity.RecommendationResult r1 = new com.example.talentflowbackend.entity.RecommendationResult();
        r1.setName(null); // this tests the null safety bug fix
        h1.setRecommendations(List.of(r1));

        when(historyRepository.findAll())
                .thenReturn(List.of(h1));

        assertDoesNotThrow(() -> {
            recommendationService.getAnalytics("Bearer fake-token");
        });
    }
}
