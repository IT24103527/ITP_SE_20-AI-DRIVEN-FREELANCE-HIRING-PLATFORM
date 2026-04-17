package com.example.talentflowbackend.controller;

import com.example.talentflowbackend.repository.RecommendationHistoryRepository;
import org.springframework.web.bind.annotation.*;
import com.example.talentflowbackend.entity.RecommendationHistory;

import java.util.List;

@RestController
@RequestMapping("/api/recommendations/history")
@CrossOrigin(origins = "http://localhost:3000")
public class HistoryController {

    private final RecommendationHistoryRepository historyRepository;

    public HistoryController(RecommendationHistoryRepository historyRepository) {
        this.historyRepository = historyRepository;
    }

    @GetMapping
    public List<RecommendationHistory> getAllHistory(
            @RequestHeader("Authorization")String authHeader){
        return historyRepository.findAll();
    }

    @DeleteMapping("/{id}")
    public void deleteHistory(@PathVariable String id) {
        historyRepository.deleteById(id);
    }
}
