package com.example.talentflowbackend.controller;

import com.example.talentflowbackend.dto.ProposalSubmitRequest;
import com.example.talentflowbackend.entity.Application;
import com.example.talentflowbackend.entity.Contract;
import com.example.talentflowbackend.entity.Job;
import com.example.talentflowbackend.entity.Notification;
import com.example.talentflowbackend.entity.User;
import com.example.talentflowbackend.repository.ApplicationRepository;
import com.example.talentflowbackend.repository.ContractRepository;
import com.example.talentflowbackend.repository.JobRepository;
import com.example.talentflowbackend.repository.NotificationRepository;
import com.example.talentflowbackend.repository.UserRepository;
import com.example.talentflowbackend.service.JwtService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Base64;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/applications")
@CrossOrigin(origins = "http://localhost:3000")
@RequiredArgsConstructor
public class ApplicationController {

    private final ApplicationRepository applicationRepository;
    private final ContractRepository contractRepository;
    private final NotificationRepository notificationRepository;
    private final JobRepository jobRepository;
    private final UserRepository userRepository;
    private final JwtService jwtService;

    // POST an application (Freelancer applying for a job)
    @PostMapping
    public ResponseEntity<?> applyForJob(
            @RequestHeader("Authorization") String authHeader,
            @Valid @RequestBody ProposalSubmitRequest payload
    ) {
        try {
            String email = jwtService.extractUsername(authHeader.substring(7));
            User freelancer = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));

            String jobId = payload.getJobId().trim();
            String coverLetter = payload.getCoverLetter().trim();

            if (coverLetter.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("message", "Cover letter cannot be empty"));
            }

            if (payload.getProposedBudget() == null || payload.getProposedBudget() <= 0) {
                return ResponseEntity.badRequest().body(Map.of("message", "Budget must be greater than 0"));
            }

            if (payload.getEstimatedDeliveryDays() == null || payload.getEstimatedDeliveryDays() <= 0) {
                return ResponseEntity.badRequest().body(Map.of("message", "Delivery time must be greater than 0"));
            }

            if (applicationRepository.existsByJobIdAndFreelancerEmailAndStatusNot(jobId, email, "DELETED")) {
                return ResponseEntity.badRequest().body(Map.of("message", "You already submitted a proposal for this job"));
            }

            if (!"application/pdf".equalsIgnoreCase(payload.getAttachmentContentType())) {
                return ResponseEntity.badRequest().body(Map.of("message", "Only PDF attachments are allowed"));
            }

            if (!payload.getAttachmentFileName().toLowerCase().endsWith(".pdf")) {
                return ResponseEntity.badRequest().body(Map.of("message", "Attachment file must have .pdf extension"));
            }

            try {
                byte[] attachmentBytes = Base64.getDecoder().decode(payload.getAttachmentBase64());
                if (attachmentBytes.length == 0) {
                    return ResponseEntity.badRequest().body(Map.of("message", "PDF file cannot be empty"));
                }
                if (attachmentBytes.length > 5 * 1024 * 1024) {
                    return ResponseEntity.badRequest().body(Map.of("message", "PDF file size must be 5MB or less"));
                }
            } catch (IllegalArgumentException ex) {
                return ResponseEntity.badRequest().body(Map.of("message", "Invalid PDF content"));
            }

            Job job = jobRepository.findById(jobId).orElse(null);
            if (job == null) {
                return ResponseEntity.badRequest().body(Map.of("message", "Job not found"));
            }
            if (!"ACTIVE".equalsIgnoreCase(job.getStatus())) {
                return ResponseEntity.badRequest().body(Map.of("message", "You can submit proposals only for active jobs"));
            }

            Application app = new Application();
            app.setJobId(jobId);
            app.setJobTitle(job.getTitle());
            app.setClientEmail(job.getClientEmail());
            app.setClientId(job.getClientId());
            app.setFreelancerEmail(email);
            app.setFreelancerName(freelancer.getFullName());
            app.setFreelancerId(freelancer.getId());
            app.setProposedBudget(payload.getProposedBudget());
            app.setEstimatedDeliveryDays(payload.getEstimatedDeliveryDays());
            app.setCoverLetter(coverLetter);
            app.setAttachmentFileName(payload.getAttachmentFileName().trim());
            app.setAttachmentContentType(payload.getAttachmentContentType());
            app.setAttachmentBase64(payload.getAttachmentBase64());
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
            List<Application> apps = applicationRepository.findByFreelancerEmailAndStatusNotOrderByAppliedAtDesc(email, "DELETED");
            return ResponseEntity.ok(apps);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // GET proposals for the logged-in client's jobs
    @GetMapping("/client")
    public ResponseEntity<?> getClientProposals(@RequestHeader("Authorization") String authHeader) {
        try {
            String email = jwtService.extractUsername(authHeader.substring(7));
            User client = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));

            if (!hasRole(client, "CLIENT")) {
                return ResponseEntity.status(403).body(Map.of("message", "Only clients can view these proposals"));
            }

            List<Job> clientJobs = jobRepository.findByClientEmailOrderByCreatedAtDesc(email);
            List<String> jobIds = clientJobs.stream()
                    .map(Job::getId)
                    .filter(id -> id != null && !id.isBlank())
                    .collect(Collectors.toList());

            List<Application> apps;
            if (jobIds.isEmpty()) {
                apps = applicationRepository.findByClientEmailAndStatusNotOrderByAppliedAtDesc(email, "DELETED");
            } else {
                apps = applicationRepository.findByJobIdInAndStatusNotOrderByAppliedAtDesc(jobIds, "DELETED");
            }
            return ResponseEntity.ok(apps);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // ACCEPT or REJECT a proposal by id (client only)
    @PutMapping("/{applicationId}/status")
    public ResponseEntity<?> updateProposalStatus(
            @PathVariable String applicationId,
            @RequestHeader("Authorization") String authHeader,
            @RequestBody Map<String, String> payload
    ) {
        try {
            String email = jwtService.extractUsername(authHeader.substring(7));
            User client = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));

            if (!hasRole(client, "CLIENT")) {
                return ResponseEntity.status(403).body(Map.of("message", "Only clients can update proposal status"));
            }

            Application application = applicationRepository.findById(applicationId)
                    .orElseThrow(() -> new RuntimeException("Proposal not found"));

            Job job = jobRepository.findById(application.getJobId())
                    .orElseThrow(() -> new RuntimeException("Related job not found"));

            // Always align the proposal with the actual job owner before permission checks.
            if (application.getClientEmail() == null || application.getClientEmail().isBlank()) {
                application.setClientEmail(job.getClientEmail());
                application.setClientId(job.getClientId());
                applicationRepository.save(application);
            }

            if (!email.equals(job.getClientEmail())) {
                return ResponseEntity.status(403).body(Map.of("message", "You do not have permission to update this proposal"));
            }

            String newStatus = payload.getOrDefault("status", "").trim().toUpperCase();
            if (!newStatus.equals("ACCEPTED") && !newStatus.equals("REJECTED")) {
                return ResponseEntity.badRequest().body(Map.of("message", "Status must be ACCEPTED or REJECTED"));
            }

            if (!"PENDING".equalsIgnoreCase(application.getStatus())) {
                return ResponseEntity.badRequest().body(Map.of("message", "Only pending proposals can be updated"));
            }

            if (application.getStatus() != null && application.getStatus().equalsIgnoreCase(newStatus)) {
                return ResponseEntity.ok(Map.of("message", "Proposal status already set", "application", application));
            }

            application.setStatus(newStatus);
            application.setUpdatedAt(new Date());
            Application savedApplication = applicationRepository.save(application);

            Contract contract = null;
            if ("ACCEPTED".equals(newStatus)) {
                contract = contractRepository.findByApplicationId(application.getId())
                        .orElseGet(() -> createContractFromApplication(application, client));
            }

            String notificationTitle = "Proposal " + ("ACCEPTED".equals(newStatus) ? "Accepted" : "Rejected");
            String notificationMessage = "Your proposal for '" + application.getJobTitle() + "' was " + newStatus.toLowerCase() + " by the client.";

            Notification notification = Notification.builder()
                    .recipientEmail(application.getFreelancerEmail())
                    .recipientRole("FREELANCER")
                    .title(notificationTitle)
                    .message(notificationMessage)
                    .type("PROPOSAL_STATUS")
                    .relatedApplicationId(application.getId())
                    .relatedContractId(contract != null ? contract.getId() : null)
                    .createdAt(new Date())
                    .build();
            notificationRepository.save(notification);

            if (contract != null) {
                return ResponseEntity.ok(Map.of(
                        "message", "Proposal accepted and contract created",
                        "application", savedApplication,
                        "contract", contract
                ));
            }

            return ResponseEntity.ok(Map.of(
                    "message", "Proposal status updated",
                    "application", savedApplication
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // UPDATE a proposal (freelancer only, only PENDING proposals)
    @PutMapping("/{applicationId}")
    public ResponseEntity<?> updateProposal(
            @PathVariable String applicationId,
            @RequestHeader("Authorization") String authHeader,
            @Valid @RequestBody ProposalSubmitRequest payload
    ) {
        try {
            String email = jwtService.extractUsername(authHeader.substring(7));
            User freelancer = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));

            if (!freelancer.getRoles().stream().anyMatch(role -> role.name().equals("FREELANCER"))) {
                return ResponseEntity.status(403).body(Map.of("message", "Only freelancers can update proposals"));
            }

            Application application = applicationRepository.findById(applicationId)
                    .orElseThrow(() -> new RuntimeException("Proposal not found"));

            if (!email.equals(application.getFreelancerEmail())) {
                return ResponseEntity.status(403).body(Map.of("message", "You do not have permission to update this proposal"));
            }

            if (!"PENDING".equalsIgnoreCase(application.getStatus())) {
                return ResponseEntity.badRequest().body(Map.of("message", "Only pending proposals can be edited"));
            }

            String coverLetter = payload.getCoverLetter().trim();

            if (coverLetter.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("message", "Cover letter cannot be empty"));
            }

            if (payload.getProposedBudget() == null || payload.getProposedBudget() <= 0) {
                return ResponseEntity.badRequest().body(Map.of("message", "Budget must be greater than 0"));
            }

            if (payload.getEstimatedDeliveryDays() == null || payload.getEstimatedDeliveryDays() <= 0) {
                return ResponseEntity.badRequest().body(Map.of("message", "Delivery time must be greater than 0"));
            }

            if (!"application/pdf".equalsIgnoreCase(payload.getAttachmentContentType())) {
                return ResponseEntity.badRequest().body(Map.of("message", "Only PDF attachments are allowed"));
            }

            if (!payload.getAttachmentFileName().toLowerCase().endsWith(".pdf")) {
                return ResponseEntity.badRequest().body(Map.of("message", "Attachment file must have .pdf extension"));
            }

            try {
                byte[] attachmentBytes = Base64.getDecoder().decode(payload.getAttachmentBase64());
                if (attachmentBytes.length == 0) {
                    return ResponseEntity.badRequest().body(Map.of("message", "PDF file cannot be empty"));
                }
                if (attachmentBytes.length > 5 * 1024 * 1024) {
                    return ResponseEntity.badRequest().body(Map.of("message", "PDF file size must be 5MB or less"));
                }
            } catch (IllegalArgumentException ex) {
                return ResponseEntity.badRequest().body(Map.of("message", "Invalid PDF content"));
            }

            application.setProposedBudget(payload.getProposedBudget());
            application.setEstimatedDeliveryDays(payload.getEstimatedDeliveryDays());
            application.setCoverLetter(coverLetter);
            application.setAttachmentFileName(payload.getAttachmentFileName().trim());
            application.setAttachmentContentType(payload.getAttachmentContentType());
            application.setAttachmentBase64(payload.getAttachmentBase64());
            application.setUpdatedAt(new Date());

            Application updatedApplication = applicationRepository.save(application);

            return ResponseEntity.ok(Map.of(
                    "message", "Proposal updated successfully",
                    "application", updatedApplication
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // DELETE a proposal (freelancer only, only PENDING proposals)
    @DeleteMapping("/{applicationId}")
    public ResponseEntity<?> deleteProposal(
            @PathVariable String applicationId,
            @RequestHeader("Authorization") String authHeader
    ) {
        try {
            String email = jwtService.extractUsername(authHeader.substring(7));
            userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));

            Application application = applicationRepository.findById(applicationId)
                    .orElseThrow(() -> new RuntimeException("Proposal not found"));

            if (!email.equals(application.getFreelancerEmail())) {
                return ResponseEntity.status(403).body(Map.of("message", "You do not have permission to delete this proposal"));
            }

            if ("DELETED".equalsIgnoreCase(application.getStatus())) {
                return ResponseEntity.ok(Map.of("message", "Proposal already deleted"));
            }

            if (!"PENDING".equalsIgnoreCase(application.getStatus())) {
                return ResponseEntity.badRequest().body(Map.of("message", "Only pending proposals can be deleted"));
            }

            application.setStatus("DELETED");
            application.setDeletedAt(new Date());
            application.setUpdatedAt(new Date());
            applicationRepository.save(application);

            // Decrement job application count, but never fail the delete if this update has an issue.
            try {
                Job job = jobRepository.findById(application.getJobId()).orElse(null);
                if (job != null && job.getApplicationCount() > 0) {
                    job.setApplicationCount(job.getApplicationCount() - 1);
                    jobRepository.save(job);
                }
            } catch (Exception ignored) {
                // Keep the proposal deletion successful even if job count recalculation fails.
            }

            return ResponseEntity.ok(Map.of("message", "Proposal deleted successfully"));
        } catch (Exception e) {
            String message = e.getMessage();
            return ResponseEntity.badRequest().body(Map.of("message", message != null ? message : "Failed to delete proposal"));
        }
    }

    private Contract createContractFromApplication(Application application, User client) {
        Job job = jobRepository.findById(application.getJobId()).orElse(new Job());
        Date now = new Date();

        Contract contract = Contract.builder()
                .applicationId(application.getId())
                .jobId(application.getJobId())
                .jobTitle(application.getJobTitle())
                .clientEmail(application.getClientEmail())
                .clientId(application.getClientId())
                .clientName(client.getFullName())
                .freelancerEmail(application.getFreelancerEmail())
                .freelancerId(application.getFreelancerId())
                .freelancerName(application.getFreelancerName())
                .budget(job.getBudget())
                .status("STARTED")
                .createdAt(now)
                .updatedAt(now)
                .startedAt(now)
                .build();

        return contractRepository.save(contract);
    }

    private boolean hasRole(User user, String roleName) {
        return user.getRoles() != null && user.getRoles().stream().anyMatch(r -> r.name().equals(roleName));
    }
}
