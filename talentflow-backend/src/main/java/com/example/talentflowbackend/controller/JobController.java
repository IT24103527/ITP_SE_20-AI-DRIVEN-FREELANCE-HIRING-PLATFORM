package com.example.talentflowbackend.controller;

import com.example.talentflowbackend.entity.Job;
import com.example.talentflowbackend.entity.User;
import com.example.talentflowbackend.repository.JobRepository;
import com.example.talentflowbackend.repository.UserRepository;
import com.example.talentflowbackend.service.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Date;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/jobs")
@CrossOrigin(origins = "http://localhost:3000")
@RequiredArgsConstructor
public class JobController {

    private final JobRepository jobRepository;
    private final UserRepository userRepository;
    private final JwtService jwtService;

    // GET all active jobs (for freelancers to browse)
    @GetMapping
    public ResponseEntity<?> getAllJobs() {
        try {
            List<Job> jobs = jobRepository.findByStatusOrderByCreatedAtDesc("ACTIVE");
            return ResponseEntity.ok(jobs);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // GET jobs posted by the logged-in client
    @GetMapping("/my")
    public ResponseEntity<?> getMyJobs(@RequestHeader("Authorization") String authHeader) {
        try {
            String email = jwtService.extractUsername(authHeader.substring(7));
            List<Job> jobs = jobRepository.findByClientEmailOrderByCreatedAtDesc(email);
            return ResponseEntity.ok(jobs);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // POST a new job (for clients)
    @PostMapping
    public ResponseEntity<?> postJob(@RequestHeader("Authorization") String authHeader, @RequestBody Job jobData) {
        try {
            String email = jwtService.extractUsername(authHeader.substring(7));
            User client = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));
            
            // Check if user has CLIENT role
            if (!client.getRoles().stream().anyMatch(role -> role.name().equals("CLIENT"))) {
                return ResponseEntity.status(403).body(Map.of("message", "Only clients can post jobs"));
            }

            jobData.setClientEmail(email);
            jobData.setClientId(client.getId());
            jobData.setCompanyName(client.getCompanyName() != null ? client.getCompanyName() : client.getFullName());
            jobData.setCreatedAt(new Date());
            jobData.setUpdatedAt(new Date());
            jobData.setStatus("ACTIVE");
            jobData.setApplicationCount(0);

            Job savedJob = jobRepository.save(jobData);
            return ResponseEntity.ok(savedJob);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // UPDATE a job (for clients)
    @PutMapping("/{id}")
    public ResponseEntity<?> updateJob(@PathVariable String id, @RequestHeader("Authorization") String authHeader, @RequestBody Job updatedJobData) {
        try {
            String email = jwtService.extractUsername(authHeader.substring(7));
            Job existingJob = jobRepository.findById(id).orElseThrow(() -> new RuntimeException("Job not found"));

            // Check authorization: only the client who posted the job can edit it
            if (!existingJob.getClientEmail().equals(email)) {
                return ResponseEntity.status(403).body(Map.of("message", "You do not have permission to edit this job"));
            }

            // Update allowed fields
            existingJob.setTitle(updatedJobData.getTitle());
            existingJob.setDescription(updatedJobData.getDescription());
            existingJob.setBudget(updatedJobData.getBudget());
            existingJob.setDeadline(updatedJobData.getDeadline());
            existingJob.setLocation(updatedJobData.getLocation());
            existingJob.setJobType(updatedJobData.getJobType());
            existingJob.setGender(updatedJobData.getGender());
            existingJob.setCareerLevel(updatedJobData.getCareerLevel());
            existingJob.setIndustry(updatedJobData.getIndustry());
            existingJob.setExperience(updatedJobData.getExperience());
            existingJob.setQualification(updatedJobData.getQualification());
            existingJob.setRequiredSkills(updatedJobData.getRequiredSkills());
            
            // Allow company logo update
            if(updatedJobData.getCompanyLogo() != null) {
                existingJob.setCompanyLogo(updatedJobData.getCompanyLogo());
            }

            existingJob.setUpdatedAt(new Date());

            Job saved = jobRepository.save(existingJob);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // DELETE a job (for clients)
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteJob(@PathVariable String id, @RequestHeader("Authorization") String authHeader) {
        try {
            String email = jwtService.extractUsername(authHeader.substring(7));
            Job existingJob = jobRepository.findById(id).orElseThrow(() -> new RuntimeException("Job not found"));

            // Check authorization
            if (!existingJob.getClientEmail().equals(email)) {
                return ResponseEntity.status(403).body(Map.of("message", "You do not have permission to delete this job"));
            }

            jobRepository.deleteById(id);
            return ResponseEntity.ok(Map.of("message", "Job deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
