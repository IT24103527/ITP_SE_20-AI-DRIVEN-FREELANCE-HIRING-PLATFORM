package com.example.talentflowbackend.repository;

import com.example.talentflowbackend.entity.Review;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface ReviewRepository extends MongoRepository<Review, String> {
    List<Review> findByReviewerType(String reviewerType);
}