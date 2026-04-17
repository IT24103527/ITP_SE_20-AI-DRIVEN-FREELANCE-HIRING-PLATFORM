package com.example.talentflowbackend.entity;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Date;

@Document(collection = "refresh_tokens")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RefreshToken {

    @Id
    private String id;

    /** SHA-256 hash of the raw refresh token — never store the raw token */
    @Indexed(unique = true)
    private String tokenHash;

    private String userId;

    /** The active role at the time of issuance */
    private String role;

    /** MongoDB TTL index — documents are auto-deleted after this date */
    @Indexed(expireAfterSeconds = 0)
    private Date expiresAt;

    private Date createdAt;

    private boolean revoked;
}
