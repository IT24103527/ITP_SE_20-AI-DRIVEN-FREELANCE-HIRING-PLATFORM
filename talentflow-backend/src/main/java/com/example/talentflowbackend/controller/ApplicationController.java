package com.example.talentflowbackend.controller;

import com.example.talentflowbackend.entity.Application;
import com.example.talentflowbackend.entity.Job;
import com.example.talentflowbackend.entity.User;
import com.example.talentflowbackend.repository.ApplicationRepository;
import com.example.talentflowbackend.repository.JobRepository;
import com.example.talentflowbackend.repository.UserRepository;
import com.example.talentflowbackend.service.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/applications")
@CrossOrigin(origins = "http://localhost:3000")
@RequiredArgsConstructor
public class ApplicationController {

    private final ApplicationRepository applicationRepository;
    private final JobRepository jobRepository;
    private final UserRepository userRepository;
    private final JwtService jwtService;

    // POST an application (Freelancer applying for a job)
    @PostMapping
    public ResponseEntity<?> applyForJob(@RequestHeader("Authorization") String authHeader, @RequestBody Map<String, String> payload) {
        try {
            String email = jwtService.extractUsername(authHeader.substring(7));
            User freelancer = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));

            // Check role
            if (!freelancer.getRoles().stream().anyMatch(role -> role.name().equals("FREELANCER"))) {
                return ResponseEntity.status(403).body(Map.of("message", "Only freelancers can apply for jobs"));
            }

            String jobId = payload.get("jobId");
            String coverLetter = payload.get("coverLetter");

            Optional<Job> jobOpt = jobRepository.findById(jobId);
            if (!jobOpt.isPresent()) {
                return ResponseEntity.badRequest().body(Map.of("message", "Job not found"));
            }
            Job job = jobOpt.get();

            Application app = new Application();
            app.setJobId(jobId);
            app.setJobTitle(job.getTitle());
            app.setFreelancerEmail(email);
            app.setFreelancerName(freelancer.getFullName());
            app.setFreelancerId(freelancer.getId());
            app.setCoverLetter(coverLetter);
            app.setAppliedAt(new Date());
            app.setUpdatedAt(new Date());
            app.setStatus("PENDING");

            applicationRepository.save(app);

            // Increment job application count
            job.setApplicationCount(job.getApplicationCount() + 1);
            jobRepository.save(job);

            return ResponseEntity.ok(app);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // GET my applications (for freelancers)
    @GetMapping("/my")
    public ResponseEntity<?> getMyApplications(@RequestHeader("Authorization") String authHeader) {
        try {
            String email = jwtService.extractUsername(authHeader.substring(7));
            List<Application> apps = applicationRepository.findByFreelancerEmailOrderByAppliedAtDesc(email);
            return ResponseEntity.ok(apps);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
