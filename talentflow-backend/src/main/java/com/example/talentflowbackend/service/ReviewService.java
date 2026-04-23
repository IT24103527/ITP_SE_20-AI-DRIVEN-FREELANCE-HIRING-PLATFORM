package com.example.talentflowbackend.service;

import com.example.talentflowbackend.entity.Review;
import com.example.talentflowbackend.repository.ReviewRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ReviewService {

    private final ReviewRepository repository;

    public ReviewService(ReviewRepository repository) {
        this.repository = repository;
    }

    public List<Review> getAll() {
        return repository.findAll();
    }

    public List<Review> getByReviewerType(String reviewerType) {
        return repository.findByReviewerType(reviewerType.toUpperCase());
    }

    public Review getById(String id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Review not found"));
    }

    public Review save(Review review) {
        normalize(review);

        if (review.getCreatedAt() == 0) {
            review.setCreatedAt(System.currentTimeMillis());
        }

        review.setSentiment(analyzeSentiment(review.getText(), review.getRating()));
        return repository.save(review);
    }

    public Review update(String id, Review updatedReview) {
        Review existing = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Review not found"));

        existing.setTargetName(updatedReview.getTargetName());
        existing.setText(updatedReview.getText());
        existing.setRating(updatedReview.getRating());

        normalize(existing);
        existing.setSentiment(analyzeSentiment(existing.getText(), existing.getRating()));

        return repository.save(existing);
    }

    public void delete(String id) {
        if (!repository.existsById(id)) {
            throw new RuntimeException("Review not found");
        }
        repository.deleteById(id);
    }

    private void normalize(Review review) {
        if (review.getReviewerName() != null) {
            review.setReviewerName(review.getReviewerName().trim());
        }
        if (review.getReviewerType() != null) {
            review.setReviewerType(review.getReviewerType().trim().toUpperCase());
        }
        if (review.getTargetName() != null) {
            review.setTargetName(review.getTargetName().trim());
        }
        if (review.getTargetType() != null) {
            review.setTargetType(review.getTargetType().trim().toUpperCase());
        }
        if (review.getText() != null) {
            review.setText(review.getText().trim());
        }
    }

    private String analyzeSentiment(String text, int rating) {
        String lower = text == null ? "" : text.toLowerCase();

        if (rating >= 4 ||
                lower.contains("good") ||
                lower.contains("great") ||
                lower.contains("excellent") ||
                lower.contains("amazing") ||
                lower.contains("helpful")) {
            return "positive";
        }

        if (rating == 3 ||
                lower.contains("okay") ||
                lower.contains("average") ||
                lower.contains("fine")) {
            return "neutral";
        }

        return "negative";
    }
}