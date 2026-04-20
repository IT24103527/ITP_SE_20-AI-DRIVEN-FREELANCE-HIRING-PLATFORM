package com.example.talentflowbackend.repository;

import com.example.talentflowbackend.entity.Application;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ApplicationRepository extends MongoRepository<Application, String> {
    List<Application> findByFreelancerEmailAndStatusNotOrderByAppliedAtDesc(String freelancerEmail, String status);
    List<Application> findByJobIdOrderByAppliedAtDesc(String jobId);
    List<Application> findByJobIdInAndStatusNotOrderByAppliedAtDesc(List<String> jobIds, String status);
    List<Application> findByClientEmailAndStatusNotOrderByAppliedAtDesc(String clientEmail, String status);
    boolean existsByJobIdAndFreelancerEmailAndStatusNot(String jobId, String freelancerEmail, String status);
    long countByJobId(String jobId);
}
