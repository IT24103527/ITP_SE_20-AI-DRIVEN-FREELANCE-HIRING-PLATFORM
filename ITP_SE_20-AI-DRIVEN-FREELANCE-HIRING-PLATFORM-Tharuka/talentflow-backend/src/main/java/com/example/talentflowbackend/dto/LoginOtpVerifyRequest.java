package com.example.talentflowbackend.dto;

import lombok.Data;

@Data
public class LoginOtpVerifyRequest {
    private String email;
    private String otp;
    /** The role the user is logging in as (CLIENT / FREELANCER / ADMIN) */
    private String role;
}
