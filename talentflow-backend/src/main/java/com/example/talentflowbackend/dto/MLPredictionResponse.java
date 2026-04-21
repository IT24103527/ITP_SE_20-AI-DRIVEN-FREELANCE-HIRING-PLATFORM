package com.example.talentflowbackend.dto;
import lombok.Data;

@Data
public class MLPredictionResponse{

    private double predictedBudget;
    private String budgetRange;
    private double successProbability;
    private String message;

}