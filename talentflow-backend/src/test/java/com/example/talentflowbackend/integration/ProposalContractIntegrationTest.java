package com.example.talentflowbackend.integration;

import com.example.talentflowbackend.controller.ApplicationController;
import com.example.talentflowbackend.controller.ContractController;
import com.example.talentflowbackend.entity.Application;
import com.example.talentflowbackend.entity.Contract;
import com.example.talentflowbackend.entity.Job;
import com.example.talentflowbackend.entity.Role;
import com.example.talentflowbackend.entity.User;
import com.example.talentflowbackend.repository.ApplicationRepository;
import com.example.talentflowbackend.repository.ContractRepository;
import com.example.talentflowbackend.repository.JobRepository;
import com.example.talentflowbackend.repository.NotificationRepository;
import com.example.talentflowbackend.repository.UserRepository;
import com.example.talentflowbackend.service.JwtService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Base64;
import java.util.Date;
import java.util.Optional;
import java.util.Set;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@Tag("integration")
@ActiveProfiles("test")
@WebMvcTest(controllers = {ApplicationController.class, ContractController.class})
@AutoConfigureMockMvc(addFilters = false)
class ProposalContractIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ApplicationRepository applicationRepository;

    @MockBean
    private ContractRepository contractRepository;

    @MockBean
    private NotificationRepository notificationRepository;

    @MockBean
    private JobRepository jobRepository;

    @MockBean
    private UserRepository userRepository;

    @MockBean
    private JwtService jwtService;

    @Test
    @DisplayName("INT-PROPOSAL-01: POST /api/applications stores a new proposal")
    void submitProposal_storesNewApplication() throws Exception {
        String freelancerEmail = "freelancer@test.com";
        String jobId = "job-1";

        when(jwtService.extractUsername("valid-token")).thenReturn(freelancerEmail);
        when(userRepository.findByEmail(freelancerEmail)).thenReturn(Optional.of(user(freelancerEmail, Role.FREELANCER)));
        when(jobRepository.findById(jobId)).thenReturn(Optional.of(job(jobId, "client@test.com")));
        when(applicationRepository.existsByJobIdAndFreelancerEmailAndStatusNot(jobId, freelancerEmail, "DELETED"))
                .thenReturn(false);
        when(applicationRepository.save(any(Application.class))).thenAnswer(invocation -> {
            Application application = invocation.getArgument(0);
            application.setId("app-1");
            return application;
        });
        when(jobRepository.save(any(Job.class))).thenAnswer(invocation -> invocation.getArgument(0));

        mockMvc.perform(post("/api/applications")
                        .header("Authorization", "Bearer valid-token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(proposalJson(jobId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("app-1"))
                .andExpect(jsonPath("$.jobId").value(jobId))
                .andExpect(jsonPath("$.freelancerEmail").value(freelancerEmail))
                .andExpect(jsonPath("$.status").value("PENDING"));

        verify(jobRepository).save(any(Job.class));
    }

    @Test
    @DisplayName("INT-PROPOSAL-02: PUT /api/applications/{id}/status accepts a proposal")
    void acceptProposal_createsContract() throws Exception {
        String clientEmail = "client@test.com";
        String applicationId = "app-1";
        String jobId = "job-1";

        when(jwtService.extractUsername("client-token")).thenReturn(clientEmail);
        when(userRepository.findByEmail(clientEmail)).thenReturn(Optional.of(user(clientEmail, Role.CLIENT)));
        when(applicationRepository.findById(applicationId)).thenReturn(Optional.of(application(applicationId, jobId, clientEmail)));
        when(jobRepository.findById(jobId)).thenReturn(Optional.of(job(jobId, clientEmail)));
        when(applicationRepository.save(any(Application.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(contractRepository.findByApplicationId(applicationId)).thenReturn(Optional.empty());
        when(contractRepository.save(any(Contract.class))).thenAnswer(invocation -> {
            Contract contract = invocation.getArgument(0);
            contract.setId("contract-1");
            return contract;
        });

        mockMvc.perform(put("/api/applications/{applicationId}/status", applicationId)
                        .header("Authorization", "Bearer client-token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"ACCEPTED\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Proposal accepted and contract created"))
                .andExpect(jsonPath("$.application.status").value("ACCEPTED"))
                .andExpect(jsonPath("$.contract.id").value("contract-1"));
    }

    @Test
    @DisplayName("INT-CONTRACT-01: PUT /api/contracts/{id}/status updates contract progress")
    void updateContractProgress_changesStatus() throws Exception {
        String freelancerEmail = "freelancer@test.com";
        String contractId = "contract-1";

        when(jwtService.extractUsername("freelancer-token")).thenReturn(freelancerEmail);
        when(userRepository.findByEmail(freelancerEmail)).thenReturn(Optional.of(user(freelancerEmail, Role.FREELANCER)));
        when(contractRepository.findById(contractId)).thenReturn(Optional.of(contract(contractId, freelancerEmail)));
        when(contractRepository.save(any(Contract.class))).thenAnswer(invocation -> invocation.getArgument(0));

        mockMvc.perform(put("/api/contracts/{contractId}/status", contractId)
                        .header("Authorization", "Bearer freelancer-token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"IN_PROGRESS\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Contract progress updated"))
                .andExpect(jsonPath("$.contract.status").value("IN_PROGRESS"));
    }

    private String proposalJson(String jobId) {
        return """
                {
                  "jobId": "%s",
                  "proposedBudget": 1200,
                  "estimatedDeliveryDays": 5,
                  "coverLetter": "I can complete this project with a clear plan and frequent updates.",
                  "attachmentFileName": "proposal.pdf",
                  "attachmentContentType": "application/pdf",
                  "attachmentBase64": "%s"
                }
                """.formatted(jobId, Base64.getEncoder().encodeToString("sample-pdf".getBytes()));
    }

    private User user(String email, Role role) {
        User user = new User();
        user.setId(email + "-id");
        user.setEmail(email);
        user.setFullName(role.name() + " User");
        user.setRoles(Set.of(role));
        return user;
    }

    private Job job(String jobId, String clientEmail) {
        Job job = new Job();
        job.setId(jobId);
        job.setTitle("Website Redesign");
        job.setClientEmail(clientEmail);
        job.setClientId(clientEmail + "-id");
        job.setBudget("1500");
        job.setStatus("ACTIVE");
        job.setApplicationCount(0);
        job.setUpdatedAt(new Date());
        return job;
    }

    private Application application(String applicationId, String jobId, String clientEmail) {
        return Application.builder()
                .id(applicationId)
                .jobId(jobId)
                .jobTitle("Website Redesign")
                .clientEmail(clientEmail)
                .clientId(clientEmail + "-id")
                .freelancerEmail("freelancer@test.com")
                .freelancerName("Freelancer User")
                .freelancerId("freelancer@test.com-id")
                .status("PENDING")
                .build();
    }

    private Contract contract(String contractId, String freelancerEmail) {
        return Contract.builder()
                .id(contractId)
                .applicationId("app-1")
                .jobId("job-1")
                .jobTitle("Website Redesign")
                .clientEmail("client@test.com")
                .clientId("client@test.com-id")
                .clientName("CLIENT User")
                .freelancerEmail(freelancerEmail)
                .freelancerId("freelancer@test.com-id")
                .freelancerName("FREELANCER User")
                .budget("1500")
                .status("STARTED")
                .createdAt(new Date())
                .updatedAt(new Date())
                .startedAt(new Date())
                .build();
    }
}