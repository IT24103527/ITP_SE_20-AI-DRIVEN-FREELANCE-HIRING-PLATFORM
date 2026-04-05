package com.example.talentflowbackend.repository;

import com.example.talentflowbackend.entity.Application;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ApplicationRepository extends MongoRepository<Application, String> {
    List<Application> findByFreelancerEmailOrderByAppliedAtDesc(String freelancerEmail);
    List<Application> findByJobIdOrderByAppliedAtDesc(String jobId);
    List<Application> findByJobIdInOrderByAppliedAtDesc(List<String> jobIds);
    long countByJobId(String jobId);
}
