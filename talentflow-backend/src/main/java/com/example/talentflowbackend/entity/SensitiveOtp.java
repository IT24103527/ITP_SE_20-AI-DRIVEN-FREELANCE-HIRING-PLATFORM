package com.example.talentflowbackend.entity;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Date;

@Document(collection = "sensitive_otps")
@CompoundIndex(name = "email_action_idx", def = "{'email': 1, 'action': 1}", unique = true)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SensitiveOtp {

    @Id
    private String id;

    private String email;

    /** One of: WITHDRAW, CHANGE_EMAIL, CHANGE_PASSWORD */
    private String action;

    /** BCrypt hash of the raw 6-digit OTP — never store the raw code */
    private String otpHash;

    /** MongoDB TTL index — documents are auto-deleted after this date */
    @Indexed(expireAfterSeconds = 0)
    private Date expiresAt;

    /** Prevents replay within the TTL window */
    private boolean used;
}
