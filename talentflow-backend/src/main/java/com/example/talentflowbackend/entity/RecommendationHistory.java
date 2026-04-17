package com.example.talentflowbackend.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.List;

@Document(collection = "recommendation_history")
public class RecommendationHistory {

    @Id
    private String id;

    private String userEmail;

    private String jobDescription;
    private LocalDateTime createdAt;

    private List<RecommendationResult> recommendations;

    // getters & setters

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getUserEmail() {
        return userEmail;
    }

    public void setUserEmail(String userEmail) {
        this.userEmail = userEmail;
    }

    public String getJobDescription() {
        return jobDescription;
    }

    public void setJobDescription(String jobDescription) {
        this.jobDescription = jobDescription;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public List<RecommendationResult> getRecommendations() {
        return recommendations;
    }

    public void setRecommendations(List<RecommendationResult> recommendations) {
        this.recommendations = recommendations;
    }
}