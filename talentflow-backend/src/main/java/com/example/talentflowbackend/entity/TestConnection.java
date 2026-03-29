package com.example.talentflowbackend.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "connection_test")
public class TestConnection {
    @Id
    private String id;
    private String status;

    public TestConnection(String status) {
        this.status = status;
    }

    // Getters
    public String getId() { return id; }
    public String getStatus() { return status; }
}