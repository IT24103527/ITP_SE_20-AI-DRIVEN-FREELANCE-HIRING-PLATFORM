package com.example.talentflowbackend.unit;

import com.example.talentflowbackend.controller.ApplicationController;
import com.example.talentflowbackend.controller.ContractController;
import com.example.talentflowbackend.dto.ProposalSubmitRequest;
import com.example.talentflowbackend.entity.Application;
import com.example.talentflowbackend.entity.Contract;
import com.example.talentflowbackend.entity.Job;
import com.example.talentflowbackend.entity.Notification;
import com.example.talentflowbackend.entity.Role;
import com.example.talentflowbackend.entity.User;
import com.example.talentflowbackend.repository.ApplicationRepository;
import com.example.talentflowbackend.repository.ContractRepository;
import com.example.talentflowbackend.repository.JobRepository;
import com.example.talentflowbackend.repository.NotificationRepository;
import com.example.talentflowbackend.repository.UserRepository;
import com.example.talentflowbackend.service.JwtService;
import com.example.talentflowbackend.service.MlService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.Base64;
import java.util.Date;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProposalContractUnitTest {

    @Mock
    private ApplicationRepository applicationRepository;

    @Mock
    private ContractRepository contractRepository;

    @Mock
    private NotificationRepository notificationRepository;

    @Mock
    private JobRepository jobRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private JwtService jwtService;

    @Mock
    private MlService mlService;

    @Test
    @DisplayName("UNIT-PROPOSAL-01: Freelancer can submit a proposal successfully")
    void applyForJob_persistsApplicationAndIncrementsCount() {
        ApplicationController applicationController = new ApplicationController(
                applicationRepository,
                contractRepository,
                notificationRepository,
                jobRepository,
                userRepository,
                jwtService,
                mlService
        );

        String freelancerEmail = "freelancer@test.com";
        String jobId = "job-1";

        User freelancer = user(freelancerEmail, "Freelancer One", Role.FREELANCER);
        Job job = job(jobId, "Client One", "client@test.com", 2, "1500", "ACTIVE");

        when(jwtService.extractUsername("valid-token")).thenReturn(freelancerEmail);
        when(userRepository.findByEmail(freelancerEmail)).thenReturn(Optional.of(freelancer));
        when(jobRepository.findById(jobId)).thenReturn(Optional.of(job));
        when(applicationRepository.existsByJobIdAndFreelancerEmailAndStatusNot(jobId, freelancerEmail, "DELETED"))
                .thenReturn(false);
        when(applicationRepository.save(any(Application.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(jobRepository.save(any(Job.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ProposalSubmitRequest payload = validProposal(jobId);
        ResponseEntity<?> response = applicationController.applyForJob("Bearer valid-token", payload);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertInstanceOf(Application.class, response.getBody());

        Application saved = (Application) response.getBody();
        assertEquals(jobId, saved.getJobId());
        assertEquals(freelancerEmail, saved.getFreelancerEmail());
        assertEquals(1200.0, saved.getProposedBudget());
        assertEquals(5, saved.getEstimatedDeliveryDays());
        assertEquals("PENDING", saved.getStatus());
        assertEquals(3, job.getApplicationCount());

        verify(applicationRepository).save(any(Application.class));
        verify(jobRepository).save(job);
    }

    @Test
    @DisplayName("UNIT-PROPOSAL-02: Client acceptance creates a contract and notification")
    void updateProposalStatus_acceptCreatesContract() {
        ApplicationController applicationController = new ApplicationController(
                applicationRepository,
                contractRepository,
                notificationRepository,
                jobRepository,
                userRepository,
                jwtService,
                mlService
        );

        String clientEmail = "client@test.com";
        String freelancerEmail = "freelancer@test.com";

        User client = user(clientEmail, "Client One", Role.CLIENT);
        Application application = Application.builder()
                .id("app-1")
                .jobId("job-1")
                .jobTitle("Website Redesign")
                .clientEmail(clientEmail)
                .clientId("client-1")
                .freelancerEmail(freelancerEmail)
                .freelancerId("freelancer-1")
                .freelancerName("Freelancer One")
                .status("PENDING")
                .build();
        Job job = job("job-1", "Client One", clientEmail, 0, "1500", "ACTIVE");

        when(jwtService.extractUsername("client-token")).thenReturn(clientEmail);
        when(userRepository.findByEmail(clientEmail)).thenReturn(Optional.of(client));
        when(applicationRepository.findById("app-1")).thenReturn(Optional.of(application));
        when(jobRepository.findById("job-1")).thenReturn(Optional.of(job));
        when(applicationRepository.save(any(Application.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(contractRepository.findByApplicationId("app-1")).thenReturn(Optional.empty());
        when(contractRepository.save(any(Contract.class))).thenAnswer(invocation -> {
            Contract contract = invocation.getArgument(0);
            contract.setId("contract-1");
            return contract;
        });

        ResponseEntity<?> response = applicationController.updateProposalStatus(
                "app-1",
                "Bearer client-token",
                Map.of("status", "ACCEPTED")
        );

        assertEquals(HttpStatus.OK, response.getStatusCode());
        Map<?, ?> body = (Map<?, ?>) response.getBody();
        assertNotNull(body);
        assertEquals("Proposal accepted and contract created", body.get("message"));

        Application updatedApplication = (Application) body.get("application");
        Contract createdContract = (Contract) body.get("contract");

        assertEquals("ACCEPTED", updatedApplication.getStatus());
        assertEquals("contract-1", createdContract.getId());
        assertEquals(clientEmail, createdContract.getClientEmail());
        assertEquals(freelancerEmail, createdContract.getFreelancerEmail());

        ArgumentCaptor<Notification> notificationCaptor = ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository).save(notificationCaptor.capture());
        assertEquals("FREELANCER", notificationCaptor.getValue().getRecipientRole());
    }

    @Test
    @DisplayName("UNIT-PROPOSAL-03: Freelancer can soft-delete a pending proposal")
    void deleteProposal_marksProposalDeleted() {
        ApplicationController applicationController = new ApplicationController(
                applicationRepository,
                contractRepository,
                notificationRepository,
                jobRepository,
                userRepository,
                jwtService,mlService
        );

        String freelancerEmail = "freelancer@test.com";
        Application application = Application.builder()
                .id("app-2")
                .jobId("job-2")
                .freelancerEmail(freelancerEmail)
                .status("PENDING")
                .build();
        Job job = job("job-2", "Client Two", "client2@test.com", 2, "900", "ACTIVE");

        when(jwtService.extractUsername("freelancer-token")).thenReturn(freelancerEmail);
        when(userRepository.findByEmail(freelancerEmail)).thenReturn(Optional.of(user(freelancerEmail, "Freelancer One", Role.FREELANCER)));
        when(applicationRepository.findById("app-2")).thenReturn(Optional.of(application));
        when(applicationRepository.save(any(Application.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(jobRepository.findById("job-2")).thenReturn(Optional.of(job));
        when(jobRepository.save(any(Job.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ResponseEntity<?> response = applicationController.deleteProposal("app-2", "Bearer freelancer-token");

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals("DELETED", application.getStatus());
        assertNotNull(application.getDeletedAt());
        assertEquals(1, job.getApplicationCount());
    }

    @Test
    @DisplayName("UNIT-CONTRACT-01: Freelancer can update contract progress")
    void updateContractStatus_updatesProgressAndTimestamps() {
        ContractController contractController = new ContractController(
                contractRepository,
                notificationRepository,
                userRepository,
                jwtService
        );

        String freelancerEmail = "freelancer@test.com";
        Contract contract = Contract.builder()
                .id("contract-1")
                .jobTitle("Website Redesign")
                .clientEmail("client@test.com")
                .freelancerEmail(freelancerEmail)
                .status("STARTED")
                .build();

        when(jwtService.extractUsername("freelancer-token")).thenReturn(freelancerEmail);
        when(userRepository.findByEmail(freelancerEmail)).thenReturn(Optional.of(user(freelancerEmail, "Freelancer One", Role.FREELANCER)));
        when(contractRepository.findById("contract-1")).thenReturn(Optional.of(contract));
        when(contractRepository.save(any(Contract.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ResponseEntity<?> response = contractController.updateContractStatus(
                "contract-1",
                "Bearer freelancer-token",
                Map.of("status", "IN_PROGRESS")
        );

        assertEquals(HttpStatus.OK, response.getStatusCode());
        Map<?, ?> body = (Map<?, ?>) response.getBody();
        assertNotNull(body);
        assertEquals("Contract progress updated", body.get("message"));

        Contract updated = (Contract) body.get("contract");
        assertEquals("IN_PROGRESS", updated.getStatus());
        assertNotNull(updated.getUpdatedAt());
        verify(notificationRepository).save(any(Notification.class));
    }

    private ProposalSubmitRequest validProposal(String jobId) {
        ProposalSubmitRequest request = new ProposalSubmitRequest();
        request.setJobId(jobId);
        request.setProposedBudget(1200.0);
        request.setEstimatedDeliveryDays(5);
        request.setCoverLetter("I can deliver this project on time with a clean implementation.");
        request.setAttachmentFileName("proposal.pdf");
        request.setAttachmentContentType("application/pdf");
        request.setAttachmentBase64(Base64.getEncoder().encodeToString("sample-pdf".getBytes()));
        return request;
    }

    private User user(String email, String fullName, Role role) {
        User user = new User();
        user.setId(email + "-id");
        user.setEmail(email);
        user.setFullName(fullName);
        user.setRoles(Set.of(role));
        return user;
    }

    private Job job(String id, String companyName, String clientEmail, int applicationCount, String budget, String status) {
        Job job = new Job();
        job.setId(id);
        job.setTitle("Website Redesign");
        job.setCompanyName(companyName);
        job.setClientEmail(clientEmail);
        job.setClientId(clientEmail + "-id");
        job.setApplicationCount(applicationCount);
        job.setBudget(budget);
        job.setStatus(status);
        job.setUpdatedAt(new Date());
        return job;
    }
}