package com.example.talentflowbackend.controller;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import com.example.talentflowbackend.dto.ApplicationRequest;

import com.example.talentflowbackend.entity.Application;
import com.example.talentflowbackend.entity.Job;
import com.example.talentflowbackend.entity.User;
import com.example.talentflowbackend.repository.ApplicationRepository;
import com.example.talentflowbackend.repository.JobRepository;
import com.example.talentflowbackend.repository.UserRepository;
import com.example.talentflowbackend.repository.NotificationRepository;
import com.example.talentflowbackend.entity.Notification;
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
@RequiredArgsConstructor
public class ApplicationController {

    private final ApplicationRepository applicationRepository;
    private final JobRepository jobRepository;
    private final UserRepository userRepository;
    private final com.example.talentflowbackend.repository.ContractRepository contractRepository;
    private final NotificationRepository notificationRepository;
    private final JwtService jwtService;

    // POST an application (Freelancer applying for a job)
    @PostMapping
    @PreAuthorize("hasRole('FREELANCER')")
    public ResponseEntity<?> applyForJob(@RequestBody ApplicationRequest request, @RequestHeader("Authorization") String authHeader) {
        try {
            String email = jwtService.extractUsername(authHeader.substring(7));
            User freelancer = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));
            
            Optional<Job> jobOpt = jobRepository.findById(request.getJobId());
            if (!jobOpt.isPresent()) {
                return ResponseEntity.badRequest().body(Map.of("message", "Job not found"));
            }
            Job job = jobOpt.get();

            Application app = new Application();
            app.setJobId(request.getJobId());
            app.setJobTitle(job.getTitle());
            app.setFreelancerEmail(email);
            app.setFreelancerName(freelancer.getFullName());
            app.setFreelancerId(freelancer.getId());
            app.setCoverLetter(request.getCoverLetter());
            app.setExperience(request.getExperience());
            app.setBidAmount(request.getBidAmount());
            app.setDeliveryTime(request.getDeliveryTime());
            app.setAttachment(request.getAttachment());
            app.setAppliedAt(new Date());
            app.setUpdatedAt(new Date());
            app.setStatus("PENDING");

            applicationRepository.save(app);

            // Increment job application count
            job.setApplicationCount(job.getApplicationCount() + 1);
            jobRepository.save(job);

            // Notify the Client (Job Owner)
            Notification notif = new Notification();
            notif.setRecipientEmail(job.getClientEmail());
            notif.setMessage("New proposal received for '" + job.getTitle() + "' from " + freelancer.getFullName());
            notif.setType("SUCCESS");
            notif.setCreatedAt(new Date());
            notif.setRead(false);
            notificationRepository.save(notif);

            return ResponseEntity.ok(app);
        } catch (Exception e) {
            String msg = "[APPLY_ERROR] " + (e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName());
            return ResponseEntity.status(500).body(Map.of("message", msg));
        }
    }

    // GET my applications (for freelancers)
    @GetMapping("/my")
    @PreAuthorize("hasRole('FREELANCER')")
    public ResponseEntity<?> getMyApplications(@RequestHeader("Authorization") String authHeader) {
        try {
            String email = jwtService.extractUsername(authHeader.substring(7));
            List<Application> apps = applicationRepository.findByFreelancerEmailOrderByAppliedAtDesc(email);
            return ResponseEntity.ok(apps);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // GET all applications for this client's jobs
    @GetMapping("/client")
    @PreAuthorize("hasRole('CLIENT')")
    public ResponseEntity<?> getAllApplicationsForClient(@RequestHeader("Authorization") String authHeader) {
        try {
            String email = jwtService.extractUsername(authHeader.substring(7));
            System.out.println("[DEBUG] getAllApplicationsForClient - Email: " + email);
            
            // 1. Get all job IDs owned by this client
            List<Job> myJobs = jobRepository.findByClientEmail(email);
            System.out.println("[DEBUG] getAllApplicationsForClient - Jobs found: " + myJobs.size());
            
            List<String> jobIds = myJobs.stream()
                    .map(Job::getId)
                    .toList();
            System.out.println("[DEBUG] getAllApplicationsForClient - Job IDs: " + jobIds);
            
            if (jobIds.isEmpty()) {
                return ResponseEntity.ok(List.of());
            }

            // 2. Fetch all applications for these jobs
            List<Application> apps = applicationRepository.findByJobIdInOrderByAppliedAtDesc(jobIds);
            System.out.println("[DEBUG] getAllApplicationsForClient - Applications found: " + apps.size());
            return ResponseEntity.ok(apps);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // GET applications for a specific job (for clients)
    @GetMapping("/job/{jobId}")
    @PreAuthorize("hasRole('CLIENT')")
    public ResponseEntity<?> getApplicationsByJob(@PathVariable String jobId, @RequestHeader("Authorization") String authHeader) {
        try {
            String email = jwtService.extractUsername(authHeader.substring(7));
            Optional<Job> jobOpt = jobRepository.findById(jobId);
            
            if (jobOpt.isPresent()) {
                Job job = jobOpt.get();
                System.out.println("[DEBUG] getApplicationsByJob - Job found: " + job.getTitle());
                // Security check: only the job owner can see applications
                if (!job.getClientEmail().equals(email)) {
                    System.out.println("[DEBUG] getApplicationsByJob - Unauthorized access. Job owner: " + job.getClientEmail() + ", Request email: " + email);
                    return ResponseEntity.status(403).body(Map.of("message", "Not authorized to view applications for this job"));
                }
                List<Application> apps = applicationRepository.findByJobIdOrderByAppliedAtDesc(jobId);
                System.out.println("[DEBUG] getApplicationsByJob - Applications found: " + apps.size());
                return ResponseEntity.ok(apps);
            }
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // UPDATE application status (for clients - Accept/Reject)
    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('CLIENT')")
    public ResponseEntity<?> updateApplicationStatus(@PathVariable String id, @RequestBody Map<String, String> statusMap, @RequestHeader("Authorization") String authHeader) {
        try {
            String email = jwtService.extractUsername(authHeader.substring(7));
            String newStatus = statusMap.get("status"); // ACCEPTED or REJECTED
            
            if (newStatus == null || (!newStatus.equals("ACCEPTED") && !newStatus.equals("REJECTED"))) {
                return ResponseEntity.badRequest().body(Map.of("message", "Invalid status. Use ACCEPTED or REJECTED"));
            }

            Optional<Application> appOpt = applicationRepository.findById(id);
            if (appOpt.isPresent()) {
                Application app = appOpt.get();
                
                // Security check: only the job owner can update status
                Optional<Job> jobOpt = jobRepository.findById(app.getJobId());
                if (!jobOpt.isPresent() || !jobOpt.get().getClientEmail().equals(email)) {
                    return ResponseEntity.status(403).body(Map.of("message", "Not authorized to update status for this proposal"));
                }

                app.setStatus(newStatus);
                app.setUpdatedAt(new Date());
                applicationRepository.save(app);

                // Send Notification to Freelancer
                String notifMsg = newStatus.equals("ACCEPTED") 
                    ? String.format("Accepted your proposal for '%s'", app.getJobTitle())
                    : String.format("Update on your proposal for '%s': Status is now %s", app.getJobTitle(), newStatus.toLowerCase());
                
                Notification notification = Notification.builder()
                        .recipientEmail(app.getFreelancerEmail())
                        .message(notifMsg)
                        .type(newStatus.equals("ACCEPTED") ? "SUCCESS" : "DANGER")
                        .jobId(app.getJobId())
                        .isRead(false)
                        .createdAt(new Date())
                        .senderName(jobOpt.get().getCompanyName() != null ? jobOpt.get().getCompanyName() : "Client")
                        .build();
                notificationRepository.save(notification);

                try {
                    if (newStatus.equals("ACCEPTED")) {
                        com.example.talentflowbackend.entity.Contract contract = com.example.talentflowbackend.entity.Contract.builder()
                                .jobId(app.getJobId())
                                .applicationId(id)
                                .jobTitle(app.getJobTitle())
                                .clientEmail(email)
                                .clientId(jobOpt.get().getClientId())
                                .freelancerEmail(app.getFreelancerEmail())
                                .freelancerName(app.getFreelancerName())
                                .freelancerId(app.getFreelancerId())
                                .amount(app.getBidAmount())
                                .status("ACTIVE")
                                .currentSituation("Contract started. Waiting for freelancer to begin work.")
                                .createdAt(new Date())
                                .updatedAt(new Date())
                                .build();
                        
                        contractRepository.save(contract);
                    }
                } catch (Exception contractEx) {
                    System.err.println("[CONTRACT_CREATION_ERROR] " + contractEx.getMessage());
                    // We don't necessarily want to fail the whole status update if just the contract save fails,
                    // but it's important to know why.
                }

                return ResponseEntity.ok(app);
            }
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // UPDATE (Edit) an application (for freelancers)
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('FREELANCER')")
    public ResponseEntity<?> updateApplication(@PathVariable String id, @RequestBody ApplicationRequest request, @RequestHeader("Authorization") String authHeader) {
        try {
            String email = jwtService.extractUsername(authHeader.substring(7));
            Optional<Application> appOpt = applicationRepository.findById(id);

            if (appOpt.isPresent()) {
                Application app = appOpt.get();
                // Security check
                if (app.getFreelancerEmail() == null || !app.getFreelancerEmail().equals(email)) {
                    return ResponseEntity.status(403).body(Map.of("message", "Not authorized up update this application"));
                }
                
                if (!"PENDING".equalsIgnoreCase(app.getStatus())) {
                    return ResponseEntity.badRequest().body(Map.of("message", "Only pending applications can be edited"));
                }

                if (request.getCoverLetter() != null) app.setCoverLetter(request.getCoverLetter());
                if (request.getExperience() != null) app.setExperience(request.getExperience());
                if (request.getBidAmount() != null) app.setBidAmount(request.getBidAmount());
                if (request.getDeliveryTime() != null) app.setDeliveryTime(request.getDeliveryTime());
                if (request.getAttachment() != null) app.setAttachment(request.getAttachment());
                
                app.setUpdatedAt(new Date());
                applicationRepository.save(app);
                
                return ResponseEntity.ok(app);
            }
            return ResponseEntity.status(404).body(Map.of("message", "[UPDATE_ERROR] Application not found with ID: " + id));
        } catch (Exception e) {
            String msg = "[UPDATE_CONTROLLER_ERROR] " + (e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName());
            return ResponseEntity.status(500).body(Map.of("message", msg));
        }
    }

    // DELETE (Cancel) an application
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('FREELANCER')")
    public ResponseEntity<?> cancelApplication(@PathVariable String id, @RequestHeader("Authorization") String authHeader) {
        try {
            String email = jwtService.extractUsername(authHeader.substring(7));
            Optional<Application> appOpt = applicationRepository.findById(id);
            
            if (appOpt.isPresent()) {
                Application app = appOpt.get();
                // Security check: only the owner can cancel
                if (app.getFreelancerEmail() == null || !app.getFreelancerEmail().equals(email)) {
                    return ResponseEntity.status(403).body(Map.of("message", "Not authorized to cancel this application"));
                }
                
                // Decrement job application count
                Optional<Job> jobOpt = jobRepository.findById(app.getJobId());
                if (jobOpt.isPresent()) {
                    Job job = jobOpt.get();
                    if (job.getApplicationCount() > 0) {
                        job.setApplicationCount(job.getApplicationCount() - 1);
                        jobRepository.save(job);
                    }
                }
                
                applicationRepository.deleteById(id);
                return ResponseEntity.ok(Map.of("message", "Application cancelled successfully"));
            }
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
