package com.example.talentflowbackend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class SensitiveOtpVerifyRequest {
    @NotBlank(message = "Action is required")
    private String action;

    @NotBlank(message = "OTP is required")
    private String otp;

    // For CHANGE_EMAIL
    private String newEmail;

    // For CHANGE_PASSWORD
    private String newPassword;

    // For WITHDRAW
    private Double amount;
    private String bankDetails;
}
