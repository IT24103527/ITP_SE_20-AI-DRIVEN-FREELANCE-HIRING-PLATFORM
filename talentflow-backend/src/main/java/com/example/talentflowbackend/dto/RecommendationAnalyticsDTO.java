package com.example.talentflowbackend.dto;

import java.util.List;

public class RecommendationAnalyticsDTO {

    private int totalRecommendations;
    private double averageMatchScore;
    private List<TopFreelancerDTO> topFreelancers;

    public RecommendationAnalyticsDTO() {}

    public RecommendationAnalyticsDTO(int totalRecommendations,
                                      double averageMatchScore,
                                      List<TopFreelancerDTO> topFreelancers) {
        this.totalRecommendations = totalRecommendations;
        this.averageMatchScore = averageMatchScore;
        this.topFreelancers = topFreelancers;
    }

    public int getTotalRecommendations() {
        return totalRecommendations;
    }

    public void setTotalRecommendations(int totalRecommendations) {
        this.totalRecommendations = totalRecommendations;
    }

    public double getAverageMatchScore() {
        return averageMatchScore;
    }

    public void setAverageMatchScore(double averageMatchScore) {
        this.averageMatchScore = averageMatchScore;
    }

    public List<TopFreelancerDTO> getTopFreelancers() {
        return topFreelancers;
    }

    public void setTopFreelancers(List<TopFreelancerDTO> topFreelancers) {
        this.topFreelancers = topFreelancers;
    }
}