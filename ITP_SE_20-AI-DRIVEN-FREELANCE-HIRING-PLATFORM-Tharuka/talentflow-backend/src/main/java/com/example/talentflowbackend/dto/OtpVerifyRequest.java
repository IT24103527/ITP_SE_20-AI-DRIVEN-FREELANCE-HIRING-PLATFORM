package com.example.talentflowbackend.dto;

import lombok.Data;

@Data
public class OtpVerifyRequest {
    private String email;
    private String otp;
    private String purpose;
}
