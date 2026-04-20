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

    private String applicationId;
    private String jobId;
    private String jobTitle;

    private String clientEmail;
    private String clientId;
    private String clientName;

    private String freelancerEmail;
    private String freelancerId;
    private String freelancerName;

    private String budget;

    @Builder.Default
    private String status = "STARTED"; // STARTED, IN_PROGRESS, COMPLETED

    private Date createdAt;
    private Date updatedAt;
    private Date startedAt;
    private Date completedAt;
}
