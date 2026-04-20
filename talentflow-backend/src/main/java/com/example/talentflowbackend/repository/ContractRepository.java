package com.example.talentflowbackend.repository;

import com.example.talentflowbackend.entity.Contract;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ContractRepository extends MongoRepository<Contract, String> {
    Optional<Contract> findByApplicationId(String applicationId);
    List<Contract> findByFreelancerEmailOrderByUpdatedAtDesc(String freelancerEmail);
    List<Contract> findByClientEmailOrderByUpdatedAtDesc(String clientEmail);
}
