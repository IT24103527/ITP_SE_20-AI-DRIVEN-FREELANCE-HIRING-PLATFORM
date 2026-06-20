package com.example.talentflowbackend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class TalentflowBackendApplication {
    public static void main(String[] args) {
        // ── JVM startup tuning ────────────────────────────────────
        System.setProperty("spring.jmx.enabled", "false");
        // Skip DNS reverse-lookup on startup (saves ~1-2s on some systems)
        System.setProperty("java.net.preferIPv4Stack", "true");
        // Reduce Tomcat startup overhead
        System.setProperty("org.apache.catalina.startup.EXIT_ON_INIT_FAILURE", "true");

        SpringApplication app = new SpringApplication(TalentflowBackendApplication.class);
        // Beans initialise on first use — biggest single startup win
        app.setLazyInitialization(true);
        // Suppress banner output
        app.setBannerMode(org.springframework.boot.Banner.Mode.OFF);
        app.run(args);
    }
}