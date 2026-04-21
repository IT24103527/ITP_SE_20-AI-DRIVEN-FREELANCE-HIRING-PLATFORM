package com.example.talentflowbackend.entity;
import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

@Document(collection = "job_predictions")
@Data
public class JobPrediction {
    @Id
    private String id;
    private String jobId;
    private String freelancerId;
    private Double successProbability;    // 0–1
    private Double estimatedBudget;// predicted final price
    private String budgetRange;
    private LocalDateTime predictedAt;
    private String message;
}
