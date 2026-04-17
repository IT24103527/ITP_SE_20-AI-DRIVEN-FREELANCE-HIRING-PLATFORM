package com.example.talentflowbackend.dto;

public class FinalRecommendationResponse {

    private String id;
    private String name;
    private String skills;
    private double matchPercentage;

    // ✅ Default constructor (important)
    public FinalRecommendationResponse() {}

    public FinalRecommendationResponse(String id, String name, String skills, double matchPercentage) {
        this.id = id;
        this.name = name;
        this.skills = skills;
        this.matchPercentage = matchPercentage;
    }

    // ✅ Getters & Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public String getSkills() {
        return skills;
    }

    public double getMatchPercentage() {
        return matchPercentage;
    }

    public void setName(String name) {
        this.name = name;
    }

    public void setSkills(String skills) {
        this.skills = skills;
    }

    public void setMatchPercentage(double matchPercentage) {
        this.matchPercentage = matchPercentage;
    }
}