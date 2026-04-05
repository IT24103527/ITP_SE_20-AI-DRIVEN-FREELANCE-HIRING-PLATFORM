package com.example.talentflowbackend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class TalentflowBackendApplication {
    public static void main(String[] args) {
        SpringApplication.run(TalentflowBackendApplication.class, args);
    }
}