package com.example.talentflowbackend.config;

import com.example.talentflowbackend.entity.Job;
import com.example.talentflowbackend.repository.JobRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.Date;

@Component
public class DataSeeder implements CommandLineRunner {

    private final JobRepository jobRepository;

    public DataSeeder(JobRepository jobRepository) {
        this.jobRepository = jobRepository;
    }

    @Override
    public void run(String... args) throws Exception {
        if (jobRepository.count() == 0) {
            System.out.println("🌱 Seeding sample job data...");

            Job job1 = new Job();
            job1.setTitle("Senior Full Stack Developer");
            job1.setDescription("We are looking for a senior developer to build a modern web application using React and Spring Boot. You will lead the development team and design the system architecture.");
            job1.setBudget("5000");
            job1.setLocation("Remote");
            job1.setCompanyName("TalentAI Solutions");
            job1.setClientEmail("client@talentai.com");
            job1.setStatus("ACTIVE");
            job1.setRequiredSkills("React, Java, Spring Boot, MongoDB");
            job1.setJobType("Full-Time");
            job1.setCreatedAt(new Date());

            Job job2 = new Job();
            job2.setTitle("UX/UI Designer (Figma)");
            job2.setDescription("Create stunning designs for our mobile app. You should have expertise in Figma, Adobe XD, and a strong portfolio of modern, clean UI designs.");
            job2.setBudget("3200");
            job2.setLocation("Colombo, Sri Lanka");
            job2.setCompanyName("Creative Edge");
            job2.setClientEmail("design@creative.edge");
            job2.setStatus("ACTIVE");
            job2.setRequiredSkills("Figma, UI/UX, Prototyping");
            job2.setJobType("Part-Time");
            job2.setCreatedAt(new Date(System.currentTimeMillis() - 86400000)); // Yesterday

            Job job3 = new Job();
            job3.setTitle("Python Data Scientist");
            job3.setDescription("We need a data scientist to build machine learning models for predictive analysis. Experience with TensorFlow and Scikit-learn is a must.");
            job3.setBudget("4500");
            job3.setLocation("Remote");
            job3.setCompanyName("DataWorks");
            job3.setClientEmail("hr@dataworks.io");
            job3.setStatus("ACTIVE");
            job3.setRequiredSkills("Python, Machine Learning, Data Analytics");
            job3.setJobType("Contract");
            job3.setCreatedAt(new Date(System.currentTimeMillis() - 3600000 * 5)); // 5 hours ago

            Job job4 = new Job();
            job4.setTitle("Mobile App Developer (Flutter)");
            job4.setDescription("Develop a cross-platform mobile app for our e-commerce platform. You should be familiar with Flutter and Firebase integration.");
            job4.setBudget("2800");
            job4.setLocation("Galle, Sri Lanka");
            job4.setCompanyName("AppLoom");
            job4.setClientEmail("support@apploom.dev");
            job4.setStatus("ACTIVE");
            job4.setRequiredSkills("Flutter, Dart, Firebase");
            job4.setJobType("Full-Time");
            job4.setCreatedAt(new Date(System.currentTimeMillis() - 86400000L * 2)); // 2 days ago

            Job job5 = new Job();
            job5.setTitle("Social Media Marketing Specialist");
            job5.setDescription("Manage our social media profiles and create highly engaging content for Instagram and LinkedIn. Experience with digital marketing tools is required.");
            job5.setBudget("1500");
            job5.setLocation("Remote");
            job5.setCompanyName("TrendSetters");
            job5.setClientEmail("social@trendsetters.com");
            job5.setStatus("ACTIVE");
            job5.setRequiredSkills("Digital Marketing, SEO, Content Creation");
            job5.setJobType("Contract");
            job5.setCreatedAt(new Date(System.currentTimeMillis() - 86400000L * 3)); // 3 days ago

            jobRepository.saveAll(Arrays.asList(job1, job2, job3, job4, job5));
            System.out.println("✅ Sample jobs seeded successfully.");
        } else {
            System.out.println("ℹ️ Database already contains data. Skipping seeding.");
        }
    }
}
