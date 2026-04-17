package com.example.talentflowbackend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class TalentflowBackendApplication {
    public static void main(String[] args) {
        // Tune JVM for faster startup
        System.setProperty("spring.jmx.enabled", "false");
        SpringApplication app = new SpringApplication(TalentflowBackendApplication.class);
        app.setLazyInitialization(true); // beans init on first use, not at startup
        app.run(args);
    }
}