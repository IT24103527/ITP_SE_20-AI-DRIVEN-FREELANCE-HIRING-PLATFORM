package com.example.talentflowbackend.system;

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
import org.springframework.test.web.servlet.MvcResult;

import java.util.Base64;
import java.util.Date;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@Tag("system")
@ActiveProfiles("test")
@WebMvcTest(controllers = {ApplicationController.class, ContractController.class})
@AutoConfigureMockMvc(addFilters = false)
class ProposalContractSystemTest {

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
    @DisplayName("SYS-PROPOSAL-01: Submit, accept, and progress a proposal through the full contract flow")
    void fullProposalToContractFlow() throws Exception {
        String freelancerEmail = "freelancer@test.com";
        String clientEmail = "client@test.com";
        String jobId = "job-1";
        String applicationId = "app-1";
        String contractId = "contract-1";

        when(jwtService.extractUsername("freelancer-token")).thenReturn(freelancerEmail);
        when(jwtService.extractUsername("client-token")).thenReturn(clientEmail);
        when(userRepository.findByEmail(freelancerEmail)).thenReturn(Optional.of(user(freelancerEmail, "Freelancer One", Role.FREELANCER)));
        when(userRepository.findByEmail(clientEmail)).thenReturn(Optional.of(user(clientEmail, "Client One", Role.CLIENT)));

        Job job = job(jobId, clientEmail);
        when(jobRepository.findById(jobId)).thenReturn(Optional.of(job));
        when(applicationRepository.existsByJobIdAndFreelancerEmailAndStatusNot(jobId, freelancerEmail, "DELETED"))
                .thenReturn(false);

        when(applicationRepository.save(any(Application.class))).thenAnswer(invocation -> {
            Application application = invocation.getArgument(0);
            if (application.getId() == null) {
                application.setId(applicationId);
            }
            return application;
        });
        when(jobRepository.save(any(Job.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Application seededApplication = application(applicationId, jobId, clientEmail, freelancerEmail);
        when(applicationRepository.findById(applicationId)).thenReturn(Optional.of(seededApplication));
        when(contractRepository.findByApplicationId(applicationId)).thenReturn(Optional.empty());
        when(contractRepository.save(any(Contract.class))).thenAnswer(invocation -> {
            Contract contract = invocation.getArgument(0);
            contract.setId(contractId);
            return contract;
        });
        when(contractRepository.findById(contractId)).thenReturn(Optional.of(contract(contractId, freelancerEmail)));

        MvcResult submitResult = mockMvc.perform(post("/api/applications")
                        .header("Authorization", "Bearer freelancer-token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(proposalJson(jobId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(applicationId))
                .andReturn();

        assertNotNull(submitResult.getResponse().getContentAsString());

        mockMvc.perform(put("/api/applications/{applicationId}/status", applicationId)
                        .header("Authorization", "Bearer client-token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"ACCEPTED\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.contract.id").value(contractId))
                .andExpect(jsonPath("$.application.status").value("ACCEPTED"));

        mockMvc.perform(put("/api/contracts/{contractId}/status", contractId)
                        .header("Authorization", "Bearer freelancer-token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"COMPLETED\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.contract.id").value(contractId))
                .andExpect(jsonPath("$.contract.status").value("COMPLETED"));
    }

    private String proposalJson(String jobId) {
        return """
                {
                  "jobId": "%s",
                  "proposedBudget": 1500,
                  "estimatedDeliveryDays": 10,
                  "coverLetter": "I can handle the full delivery with clear milestones and regular updates.",
                  "attachmentFileName": "proposal.pdf",
                  "attachmentContentType": "application/pdf",
                  "attachmentBase64": "%s"
                }
                """.formatted(jobId, Base64.getEncoder().encodeToString("sample-pdf".getBytes()));
    }

    private User user(String email, String fullName, Role role) {
        User user = new User();
        user.setId(email + "-id");
        user.setEmail(email);
        user.setFullName(fullName);
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

    private Application application(String applicationId, String jobId, String clientEmail, String freelancerEmail) {
        return Application.builder()
                .id(applicationId)
                .jobId(jobId)
                .jobTitle("Website Redesign")
                .clientEmail(clientEmail)
                .clientId(clientEmail + "-id")
                .freelancerEmail(freelancerEmail)
                .freelancerName("Freelancer One")
                .freelancerId(freelancerEmail + "-id")
                .proposedBudget(1500.0)
                .estimatedDeliveryDays(10)
                .coverLetter("I can handle the full delivery with clear milestones and regular updates.")
                .attachmentFileName("proposal.pdf")
                .attachmentContentType("application/pdf")
                .attachmentBase64(Base64.getEncoder().encodeToString("sample-pdf".getBytes()))
                .status("PENDING")
                .appliedAt(new Date())
                .updatedAt(new Date())
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
                .clientName("Client One")
                .freelancerEmail(freelancerEmail)
                .freelancerId(freelancerEmail + "-id")
                .freelancerName("Freelancer One")
                .budget("1500")
                .status("STARTED")
                .createdAt(new Date())
                .updatedAt(new Date())
                .startedAt(new Date())
                .build();
    }
}