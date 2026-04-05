package com.example.talentflowbackend.dto;

import lombok.Data;

@Data
public class OtpRequest {
    private String email;
    private String phoneNumber;
    private String purpose; // REGISTRATION, LOGIN, PASSWORD_CHANGE
}
