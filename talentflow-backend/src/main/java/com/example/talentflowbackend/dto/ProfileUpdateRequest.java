package com.example.talentflowbackend.dto;

import lombok.Data;

@Data
public class ProfileUpdateRequest {
    private String fullName;
    private String phoneNumber;
    // Client fields
    private String companyName;
    private String industry;
    private String companySize;
    // Freelancer fields
    private String professionalTitle;
    private String skills;
    private String portfolioUrl;
    private String bio;
    private Double hourlyRate;
    private String experience;
    // Admin fields
    private String department;
}
