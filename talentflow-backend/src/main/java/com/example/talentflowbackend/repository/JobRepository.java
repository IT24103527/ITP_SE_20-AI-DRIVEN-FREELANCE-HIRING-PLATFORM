package com.example.talentflowbackend.repository;

import com.example.talentflowbackend.entity.Job;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface JobRepository extends MongoRepository<Job, String> {
    List<Job> findByClientEmailOrderByCreatedAtDesc(String clientEmail);
    List<Job> findAllByOrderByCreatedAtDesc();
    List<Job> findByStatusOrderByCreatedAtDesc(String status);
}
