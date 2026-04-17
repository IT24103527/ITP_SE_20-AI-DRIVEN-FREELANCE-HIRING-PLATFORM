package com.example.talentflowbackend.repository;

import com.example.talentflowbackend.entity.RecommendationHistory;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RecommendationHistoryRepository
        extends MongoRepository<RecommendationHistory, String> {

    //  Get history for logged-in user
    List<RecommendationHistory> findByUserEmail(String userEmail);

    //  Optional: latest first (better UX)
    List<RecommendationHistory> findByUserEmailOrderByCreatedAtDesc(String userEmail);
}