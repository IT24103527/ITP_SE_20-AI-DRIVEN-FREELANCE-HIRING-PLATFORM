package com.example.talentflowbackend.controller;
import com.example.talentflowbackend.dto.*;
import com.example.talentflowbackend.service.RecommendationService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "http://localhost:3000")
@RestController
@RequestMapping("/api/recommendations")
public class RecommendationController {

    private final RecommendationService recommendationService;

    public RecommendationController(RecommendationService recommendationService) {
        this.recommendationService = recommendationService;
    }

    @PostMapping
    public List<FinalRecommendationResponse> recommend(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody RecommendationRequest request){
        if (request == null) {
            throw new RuntimeException("Request body cannot be empty");
        }

        if (request.getJobDescription() == null ||
                request.getJobDescription().trim().isEmpty()) {

            throw new IllegalArgumentException("Job description is required");
        }

        return recommendationService.getRecommendations(
                request.getJobDescription(),
                authHeader
        );
    }

}
