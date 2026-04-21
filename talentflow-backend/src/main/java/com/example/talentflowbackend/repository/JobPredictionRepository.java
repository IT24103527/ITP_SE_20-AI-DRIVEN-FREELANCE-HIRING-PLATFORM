package com.example.talentflowbackend.repository;
import com.example.talentflowbackend.entity.JobPrediction;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface JobPredictionRepository extends MongoRepository<JobPrediction, String> {
    List<JobPrediction> findByJobId(String jobId);
    Optional<JobPrediction> findByJobIdAndFreelancerId(String jobId, String freelancerId);
}

