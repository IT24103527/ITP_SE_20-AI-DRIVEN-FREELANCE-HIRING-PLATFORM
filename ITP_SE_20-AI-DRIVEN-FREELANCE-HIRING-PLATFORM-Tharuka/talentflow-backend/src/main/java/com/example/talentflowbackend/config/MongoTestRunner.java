package com.example.talentflowbackend.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import com.example.talentflowbackend.repository.TestRepository;
import com.example.talentflowbackend.entity.TestConnection;

@Component
public class MongoTestRunner implements CommandLineRunner {

    private final TestRepository testRepository;

    public MongoTestRunner(TestRepository testRepository) {
        this.testRepository = testRepository;
    }

    @Override
    public void run(String... args) throws Exception {
        try {
            long count = testRepository.count();
            if (count == 0) {
                TestConnection test = new TestConnection("Database is Connected Successfully!");
                testRepository.save(test);
                System.out.println("✅ MongoDB connected and test document saved.");
            } else {
                System.out.println("✅ MongoDB connected. Collections ready.");
            }
        } catch (Exception e) {
            System.err.println("❌ MongoDB connection failed: " + e.getMessage());
        }
    }
}
