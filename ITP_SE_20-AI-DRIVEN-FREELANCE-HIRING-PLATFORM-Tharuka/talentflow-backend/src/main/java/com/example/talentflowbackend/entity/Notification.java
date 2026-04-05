package com.example.talentflowbackend.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Date;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "notifications")
public class Notification {
    @Id
    private String id;
    private String recipientEmail;
    private String message;
    private String type; // INFO, SUCCESS, WARNING, DANGER
    @JsonProperty("isRead")
    private boolean isRead;
    private Date createdAt;
    private String jobId;
    private String contractId;
    private String senderName;
}
