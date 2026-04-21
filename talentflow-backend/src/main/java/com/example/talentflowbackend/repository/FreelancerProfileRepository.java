package com.example.talentflowbackend.repository;
import com.example.talentflowbackend.entity.FreelancerProfile;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface FreelancerProfileRepository extends MongoRepository<FreelancerProfile, String> {
    FreelancerProfile findByUserId(String userId);
}

