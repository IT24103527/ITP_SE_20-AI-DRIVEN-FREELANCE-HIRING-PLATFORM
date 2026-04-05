package com.example.talentflowbackend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class FreelancerRegRequest {
    @NotBlank(message = "Full name is required")
    private String fullName;

    @NotBlank(message = "Email is required")
    private String email;          // validated for '@' presence only

    @NotBlank(message = "Password is required")
    private String password;

    private String professionalTitle;
    private String phoneNumber;
    private String skills;
    private String portfolioUrl;
    private String bio;
    private Double hourlyRate;
    private String experience;
}
