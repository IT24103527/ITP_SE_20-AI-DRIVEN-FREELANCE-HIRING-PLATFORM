package com.example.talentflowbackend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class SensitiveOtpRequest {
    @NotBlank(message = "Action is required")
    private String action;
}
