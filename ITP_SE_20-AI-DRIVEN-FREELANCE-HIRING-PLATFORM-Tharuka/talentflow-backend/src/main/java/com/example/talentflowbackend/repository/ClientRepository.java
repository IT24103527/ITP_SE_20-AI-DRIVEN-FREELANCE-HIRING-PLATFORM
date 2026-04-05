package com.example.talentflowbackend.repository;

import com.example.talentflowbackend.entity.Client;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface ClientRepository extends MongoRepository<Client, String> {
    Optional<Client> findByEmail(String email);
}