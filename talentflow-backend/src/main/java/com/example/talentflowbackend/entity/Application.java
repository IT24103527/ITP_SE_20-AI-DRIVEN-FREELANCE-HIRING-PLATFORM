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

    // Freelancer info
    private String freelancerEmail;
    private String freelancerName;
    private String freelancerId;

    private String coverLetter;

    @Builder.Default
    private String status = "PENDING"; // PENDING, ACCEPTED, REJECTED

    private Date appliedAt;
    private Date updatedAt;
}
