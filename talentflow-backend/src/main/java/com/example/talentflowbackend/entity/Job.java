package com.example.talentflowbackend.entity;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Date;

@Document(collection = "jobs")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Job {

    @Id
    private String id;

    private String title;
    private String description;
    
    // Changing budget to a String to support exact value or text if needed without a range (e.g. "500").
    private String budget; 
    private Date deadline;
    private String requiredSkills;

    // Detailed Job Overview requirements
    private String gender;
    private String careerLevel;
    private String industry;
    private String experience;
    private String qualification;
    private String location;
    private String jobType; // e.g. Full-Time, Part-Time

    // Owner info
    private String companyLogo; // Base64 encoding
    private String clientEmail;
    private String clientId;
    private String companyName;

    @Builder.Default
    private String status = "ACTIVE"; // ACTIVE, CLOSED

    private Date createdAt;
    private Date updatedAt;

    @Builder.Default
    private int applicationCount = 0;
}
