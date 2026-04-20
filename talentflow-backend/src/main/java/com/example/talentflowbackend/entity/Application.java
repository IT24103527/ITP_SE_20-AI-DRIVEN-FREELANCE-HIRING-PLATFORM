package com.example.talentflowbackend.entity;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Date;

@Document(collection = "applications")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Application {

    @Id
    private String id;

    private String jobId;
    private String jobTitle;  // denormalized for display

    // Client info (owner of the job)
    private String clientEmail;
    private String clientId;

    // Freelancer info
    private String freelancerEmail;
    private String freelancerName;
    private String freelancerId;

    private Double proposedBudget;
    private Integer estimatedDeliveryDays;
    private String coverLetter;
    private String attachmentFileName;
    private String attachmentContentType;
    private String attachmentBase64;

    @Builder.Default
    private String status = "PENDING"; // PENDING, ACCEPTED, REJECTED, DELETED

    private Date deletedAt;

    private Date appliedAt;
    private Date updatedAt;
}
