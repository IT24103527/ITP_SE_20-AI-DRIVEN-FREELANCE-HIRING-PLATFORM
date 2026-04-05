package com.example.talentflowbackend.repository;
import com.example.talentflowbackend.entity.TestConnection;

import org.springframework.data.mongodb.repository.MongoRepository;

public interface TestRepository extends MongoRepository<TestConnection, String> {
}