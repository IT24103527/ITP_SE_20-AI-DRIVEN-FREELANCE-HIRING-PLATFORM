package com.example.talentflowbackend.entity;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Date;

@Document(collection = "notifications")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Notification {

    @Id
    private String id;

    private String recipientEmail;
    private String recipientRole;

    private String title;
    private String message;
    private String type;

    private String relatedApplicationId;
    private String relatedContractId;

    @Builder.Default
    private boolean read = false;

    private Date createdAt;
    private Date readAt;
}
