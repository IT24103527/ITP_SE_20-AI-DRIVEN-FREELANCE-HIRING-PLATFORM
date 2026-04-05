package com.example.talentflowbackend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class LoginRequest {
    @NotBlank(message = "Email is required")
    private String email;

    @NotBlank(message = "Password is required")
    private String password;

    /** The role portal the user is logging into: CLIENT / FREELANCER / ADMIN */
    private String role;
}
