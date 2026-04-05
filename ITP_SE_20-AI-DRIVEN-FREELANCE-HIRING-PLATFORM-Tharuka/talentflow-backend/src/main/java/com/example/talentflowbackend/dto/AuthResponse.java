package com.example.talentflowbackend.dto;

import com.example.talentflowbackend.entity.User;
import lombok.*;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {
    private String token;
    private String message;
    private String role;
    private List<String> roles;
    private Boolean otpRequired;
    private Boolean locked;
    private Long lockSecondsRemaining;
    private String qrCode;
    private String totpSecret;
    private User user;
}
