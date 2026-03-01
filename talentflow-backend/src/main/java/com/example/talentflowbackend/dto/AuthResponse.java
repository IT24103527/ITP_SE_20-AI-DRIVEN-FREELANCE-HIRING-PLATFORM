package com.example.talentflowbackend.dto;
import lombok.*;



@Data @Builder @AllArgsConstructor @NoArgsConstructor
public class AuthResponse {
    private String token;
    private String role;
}
