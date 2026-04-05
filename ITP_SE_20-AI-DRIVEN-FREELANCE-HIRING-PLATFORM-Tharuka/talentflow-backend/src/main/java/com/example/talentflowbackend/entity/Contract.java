package com.example.talentflowbackend.entity;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Date;

@Document(collection = "contracts")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Contract {
    @Id
    private String id;
    
    private String jobId;
    private String applicationId;
    private String jobTitle;
    
    // Client Info
    private String clientEmail;
    private String clientId;
    
    // Freelancer Info
    private String freelancerEmail;
    private String freelancerName;
    private String freelancerId;
    
    private String amount;
    
    @Builder.Default
    private String status = "ACTIVE"; // ACTIVE, COMPLETED, CANCELLED
    
    @Builder.Default
    private String currentSituation = "Contract started. Work in progress.";
    
    private Date createdAt;
    private Date updatedAt;
}
