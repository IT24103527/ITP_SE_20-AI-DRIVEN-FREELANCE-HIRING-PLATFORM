package com.example.talentflowbackend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ClientRegRequest {
    @NotBlank(message = "Full name is required")
    private String fullName;

    @NotBlank(message = "Email is required")
    private String email;          // validated for '@' presence only

    @NotBlank(message = "Password is required")
    private String password;

    private String companyName;
    private String phoneNumber;
}
