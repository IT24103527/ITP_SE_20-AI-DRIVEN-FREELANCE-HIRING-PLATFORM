package com.example.talentflowbackend.controller;

import com.example.talentflowbackend.dto.FinalRecommendationResponse;
import com.example.talentflowbackend.dto.RecommendationAnalyticsDTO;
import com.example.talentflowbackend.dto.TopFreelancerDTO;
import com.example.talentflowbackend.service.RecommendationService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/* ─────────────────────────────────────
   CONTROLLER TEST
───────────────────────────────────── */
@WebMvcTest(controllers = RecommendationController.class)
class RecommendationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private RecommendationService recommendationService;

    @Autowired
    private ObjectMapper objectMapper;

    /* ─────────────────────────────────────
       TEST 1: POST /api/recommendations
    ───────────────────────────────────── */
    @Test
    void testGetRecommendations_success() throws Exception {

        // Mock response
        FinalRecommendationResponse response =
                new FinalRecommendationResponse(
                        "1",
                        "John Doe",
                        "React",
                        95.0
                );

        when(recommendationService.getRecommendations(org.mockito.ArgumentMatchers.eq("React developer"), org.mockito.ArgumentMatchers.anyString()))
                .thenReturn(List.of(response));

        // Request body
        String requestJson = """
        {
            "jobDescription": "React developer"
        }
        """;

        mockMvc.perform(post("/api/recommendations")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("John Doe"))
                .andExpect(jsonPath("$[0].matchPercentage").value(95.0));
    }

    /* ─────────────────────────────────────
       TEST 2: POST EMPTY INPUT
    ───────────────────────────────────── */
    @Test
    void testGetRecommendations_emptyInput() throws Exception {

        when(recommendationService.getRecommendations(org.mockito.ArgumentMatchers.eq(""), org.mockito.ArgumentMatchers.anyString()))
                .thenReturn(List.of());

        String requestJson = """
        {
            "jobDescription": ""
        }
        """;

        mockMvc.perform(post("/api/recommendations")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestJson))
                .andExpect(status().isOk())
                .andExpect(content().json("[]"));
    }

    /* ─────────────────────────────────────
       TEST 3: GET /analytics
    ───────────────────────────────────── */
    @Test
    void testGetAnalytics_success() throws Exception {

        TopFreelancerDTO top = new TopFreelancerDTO();
        top.setName("John");
        top.setCount(3);

        RecommendationAnalyticsDTO dto = new RecommendationAnalyticsDTO();
        dto.setTotalRecommendations(5);
        dto.setAverageMatchScore(85.0);
        dto.setTopFreelancers(List.of(top));

        when(recommendationService.getAnalytics(org.mockito.ArgumentMatchers.anyString())).thenReturn(dto);

        mockMvc.perform(get("/api/recommendations/analytics"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalRecommendations").value(5))
                .andExpect(jsonPath("$.averageMatchScore").value(85.0))
                .andExpect(jsonPath("$.topFreelancers[0].name").value("John"));
    }

    /* ─────────────────────────────────────
       TEST 4: SERVICE ERROR HANDLING
    ───────────────────────────────────── */
    @Test
    void testGetAnalytics_error() throws Exception {

        when(recommendationService.getAnalytics(org.mockito.ArgumentMatchers.anyString()))
                .thenThrow(new RuntimeException("Server error"));

        mockMvc.perform(get("/api/recommendations/analytics"))
                .andExpect(status().isInternalServerError());
    }
}
