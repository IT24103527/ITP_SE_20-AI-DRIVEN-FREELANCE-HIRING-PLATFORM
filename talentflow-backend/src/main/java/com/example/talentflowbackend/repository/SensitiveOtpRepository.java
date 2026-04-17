package com.example.talentflowbackend.repository;

import com.example.talentflowbackend.entity.SensitiveOtp;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface SensitiveOtpRepository extends MongoRepository<SensitiveOtp, String> {
    Optional<SensitiveOtp> findByEmailAndAction(String email, String action);
    void deleteByEmailAndAction(String email, String action);
}
