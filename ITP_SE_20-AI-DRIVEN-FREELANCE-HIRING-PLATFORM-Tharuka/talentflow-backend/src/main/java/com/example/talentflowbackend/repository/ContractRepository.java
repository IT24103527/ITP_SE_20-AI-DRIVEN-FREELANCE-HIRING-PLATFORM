package com.example.talentflowbackend.repository;

import com.example.talentflowbackend.entity.Contract;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface ContractRepository extends MongoRepository<Contract, String> {
    List<Contract> findByClientEmailOrderByCreatedAtDesc(String clientEmail);
    List<Contract> findByFreelancerEmailOrderByCreatedAtDesc(String freelancerEmail);
    List<Contract> findByJobId(String jobId);
}
