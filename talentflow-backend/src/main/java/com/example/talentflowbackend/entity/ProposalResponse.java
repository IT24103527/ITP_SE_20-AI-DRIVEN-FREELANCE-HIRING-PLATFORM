package com.example.talentflowbackend.entity;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.mongodb.core.mapping.Document;
import java.util.Date;

@Document(collection = "proposal_response")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProposalResponse {
    private String id;
    private String jobId;
    private String freelancerId;
    private String freelancerName;
    private Double proposedPrice;
    private String status;
    private Date submittedAt;
    private Double successProbability;   // from JobPrediction
    private Double estimatedBudget;
    private String message;
    private String JobTitle;
}
