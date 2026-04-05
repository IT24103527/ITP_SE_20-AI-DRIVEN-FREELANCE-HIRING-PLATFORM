package com.example.talentflowbackend.dto;

import lombok.Data;

@Data
public class ApplicationRequest {
    private String jobId;
    private String coverLetter;
    private String experience;
    private String bidAmount;
    private String deliveryTime;
    private String attachment;
}
