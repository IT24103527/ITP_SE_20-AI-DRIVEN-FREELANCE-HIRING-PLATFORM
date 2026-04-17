package com.example.talentflowbackend.dto;

public class RecommendationResponse {

    private String freelancer_id;
    private Double match_percentage;

    public RecommendationResponse() {}

    public RecommendationResponse(String freelancer_id, Double match_percentage) {
        this.freelancer_id = freelancer_id;
        this.match_percentage = match_percentage;
    }

    public String getFreelancer_id() {
        return freelancer_id;
    }

    public void setFreelancer_id(String freelancer_id) {
        this.freelancer_id = freelancer_id;
    }

    public Double getMatch_percentage() {
        return match_percentage;
    }

    public void setMatch_percentage(Double match_percentage) {
        this.match_percentage = match_percentage;
    }
}