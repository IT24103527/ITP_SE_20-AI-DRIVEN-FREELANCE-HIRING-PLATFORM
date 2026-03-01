package com.example.talentflowbackend.dto;

import lombok.*;



@Data
public class ClientRegRequest {
    private String fullName;
    private String email;
    private String password;
    private String companyName;
    private String phoneNumber;
}

