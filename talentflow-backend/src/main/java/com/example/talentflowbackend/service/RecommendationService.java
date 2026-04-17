package com.example.talentflowbackend.service;

import com.example.talentflowbackend.dto.*;
import com.example.talentflowbackend.entity.*;
import com.example.talentflowbackend.repository.RecommendationHistoryRepository;
import com.example.talentflowbackend.repository.UserRepository;

import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class RecommendationService {

    private final RestTemplate restTemplate;
    private final UserRepository userRepository;
    private final RecommendationHistoryRepository historyRepository;
    private final JwtService jwtService;

    private final String FLASK_URL = "http://localhost:5000/recommend";

    public RecommendationService(RestTemplate restTemplate,
                                 UserRepository userRepository,
                                 RecommendationHistoryRepository historyRepository,
                                 JwtService jwtService) {
        this.restTemplate = restTemplate;
        this.userRepository = userRepository;
        this.historyRepository = historyRepository;
        this.jwtService = jwtService;
    }

    public List<FinalRecommendationResponse> getRecommendations(String jobDescription, String authHeader) {

        // Validate header
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new RuntimeException("Invalid or missing Authorization header");
        }

        String email = jwtService.extractUsername(authHeader.substring(7));

        User client = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Use correct role check
        if (!client.hasRole(Role.CLIENT)) {
            throw new RuntimeException("Only clients can request recommendations");
        }

        // Get freelancers from User table
        List<User> freelancers = userRepository.findAll().stream()
                .filter(user -> user.hasRole(Role.FREELANCER))
                .toList();

        List<Map<String, Object>> freelancerList = new ArrayList<>();

        for (User f : freelancers) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", f.getId());
            map.put("skills", f.getSkills() != null ? f.getSkills() : "");
            freelancerList.add(map);
        }

        // Call Flask AI
        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("job_description", jobDescription);
        requestBody.put("freelancers", freelancerList);

        org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
        headers.setContentType(org.springframework.http.MediaType.APPLICATION_JSON);
        org.springframework.http.HttpEntity<Map<String, Object>> entity = new org.springframework.http.HttpEntity<>(requestBody, headers);

        RecommendationResponse[] flaskResults = restTemplate.postForObject(
                FLASK_URL,
                entity,
                RecommendationResponse[].class
        );

        List<FinalRecommendationResponse> finalResults = new ArrayList<>();
        List<RecommendationResult> historyResults = new ArrayList<>();

        if (flaskResults != null) {
            for (RecommendationResponse r : flaskResults) {

                User freelancer = freelancers.stream()
                        .filter(f -> f.getId().equals(r.getFreelancer_id()))
                        .findFirst()
                        .orElse(null);

                if (freelancer != null) {

                    FinalRecommendationResponse response =
                            new FinalRecommendationResponse(
                                    freelancer.getId(),
                                    freelancer.getFullName(),
                                    freelancer.getSkills(),
                                    r.getMatch_percentage()
                            );

                    finalResults.add(response);

                    RecommendationResult historyResult = new RecommendationResult();
                    historyResult.setFreelancerId(freelancer.getId());
                    historyResult.setName(freelancer.getFullName());
                    historyResult.setSkills(freelancer.getSkills());
                    historyResult.setMatchPercentage(r.getMatch_percentage());

                    historyResults.add(historyResult);
                }
            }
        }

        // 🔽 Sort both lists (important for UI consistency)
        finalResults.sort((a, b) -> Double.compare(b.getMatchPercentage(), a.getMatchPercentage()));
        historyResults.sort((a, b) -> Double.compare(b.getMatchPercentage(), a.getMatchPercentage()));

        // 💾 Save history
        RecommendationHistory history = new RecommendationHistory();
        history.setUserEmail(email);
        history.setJobDescription(jobDescription);
        history.setCreatedAt(LocalDateTime.now());
        history.setRecommendations(historyResults);

        historyRepository.save(history);

        return finalResults;
    }

    public RecommendationAnalyticsDTO getAnalytics(String authHeader) {

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new RuntimeException("Invalid or missing Authorization header");
        }

        String email = jwtService.extractUsername(authHeader.substring(7));

        List<RecommendationHistory> history =
                historyRepository.findByUserEmailOrderByCreatedAtDesc(email);

        int total = history.size();

        double avgScore = history.stream()
                .flatMap(h -> h.getRecommendations().stream())
                .filter(r -> r.getMatchPercentage() != null)
                .mapToDouble(RecommendationResult::getMatchPercentage)
                .average()
                .orElse(0);

        avgScore = Math.round(avgScore * 10.0) / 10.0;

        Map<String, Long> grouped = history.stream()
                .flatMap(h -> h.getRecommendations().stream())
                .filter(r -> r.getName() != null)
                .collect(Collectors.groupingBy(
                        RecommendationResult::getName,
                        Collectors.counting()
                ));

        List<TopFreelancerDTO> topList = grouped.entrySet().stream()
                .sorted((a, b) -> Long.compare(b.getValue(), a.getValue()))
                .limit(5)
                .map(e -> {
                    TopFreelancerDTO dto = new TopFreelancerDTO();
                    dto.setName(e.getKey());
                    dto.setCount(e.getValue().intValue());
                    return dto;
                })
                .toList();

        RecommendationAnalyticsDTO dto = new RecommendationAnalyticsDTO();
        dto.setTotalRecommendations(total);
        dto.setAverageMatchScore(avgScore);
        dto.setTopFreelancers(topList);

        return dto;
    }
}