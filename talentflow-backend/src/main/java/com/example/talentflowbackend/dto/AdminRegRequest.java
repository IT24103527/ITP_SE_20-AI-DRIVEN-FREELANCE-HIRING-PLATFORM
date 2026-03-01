package com.example.talentflowbackend.dto;
import lombok.*;
@Data
public class AdminRegRequest {
    private String fullName;
    private String email;
    private String password;
    private String adminCode;
    private String department;
}



