package com.example.talentflowbackend.dto;

import java.util.List;

public class RecommendationRequest {

    private String jobDescription;
    private List<FreelancerDTO> freelancers; // optional

    public RecommendationRequest() {}

    public String getJobDescription() {
        return jobDescription;
    }

    public void setJobDescription(String jobDescription) {
        this.jobDescription = jobDescription;
    }

    public List<FreelancerDTO> getFreelancers() {
        return freelancers;
    }

    public void setFreelancers(List<FreelancerDTO> freelancers) {
        this.freelancers = freelancers;
    }
}