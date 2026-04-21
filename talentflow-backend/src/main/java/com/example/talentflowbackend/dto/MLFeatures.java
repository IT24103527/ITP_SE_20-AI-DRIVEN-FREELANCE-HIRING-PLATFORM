package com.example.talentflowbackend.dto;

import lombok.Data;

@Data
public class MLFeatures {
    private double rating;
    private int completedJobs;
    private int skillCount;
    private double budgetRatio;
}
