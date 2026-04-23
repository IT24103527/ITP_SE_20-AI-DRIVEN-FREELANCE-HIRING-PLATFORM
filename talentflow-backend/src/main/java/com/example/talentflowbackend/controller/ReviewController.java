package com.example.talentflowbackend.controller;

import com.example.talentflowbackend.entity.Review;
import com.example.talentflowbackend.service.ReviewService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reviews")
@CrossOrigin(origins = "http://localhost:3000")
public class ReviewController {

    private final ReviewService service;

    public ReviewController(ReviewService service) {
        this.service = service;
    }

    @GetMapping
    public List<Review> getAll(@RequestParam(required = false) String reviewerType) {
        if (reviewerType != null && !reviewerType.isBlank()) {
            return service.getByReviewerType(reviewerType);
        }
        return service.getAll();
    }

    @GetMapping("/{id}")
    public Review getById(@PathVariable String id) {
        return service.getById(id);
    }

    @PostMapping
    public Review add(@Valid @RequestBody Review review) {
        return service.save(review);
    }

    @PutMapping("/{id}")
    public Review update(@PathVariable String id, @Valid @RequestBody Review review) {
        return service.update(id, review);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable String id) {
        service.delete(id);
    }
}