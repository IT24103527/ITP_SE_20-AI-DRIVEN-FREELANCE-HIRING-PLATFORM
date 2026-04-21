package com.example.talentflowbackend.repository;

import com.example.talentflowbackend.entity.ProposalResponse;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface ProposalResponseRepository extends MongoRepository<ProposalResponse,String> {

    List<ProposalResponse> findByJobId(String jobId);
}
