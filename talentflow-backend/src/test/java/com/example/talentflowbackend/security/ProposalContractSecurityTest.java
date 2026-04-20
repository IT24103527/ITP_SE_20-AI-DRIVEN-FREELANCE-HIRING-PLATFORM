package com.example.talentflowbackend.security;

import com.example.talentflowbackend.controller.ApplicationController;
import com.example.talentflowbackend.controller.ContractController;
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

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@Tag("security")
@ActiveProfiles("test")
@WebMvcTest(controllers = {ApplicationController.class, ContractController.class})
@AutoConfigureMockMvc
class ProposalContractSecurityTest {

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
    @DisplayName("SEC-PROPOSAL-01: POST /api/applications requires authentication")
    void submitProposal_withoutToken_returns401() throws Exception {
        mockMvc.perform(post("/api/applications")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("SEC-PROPOSAL-02: GET /api/applications/my requires authentication")
    void getMyApplications_withoutToken_returns401() throws Exception {
        mockMvc.perform(get("/api/applications/my"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("SEC-PROPOSAL-03: PUT /api/applications/{id}/status requires authentication")
    void updateProposalStatus_withoutToken_returns401() throws Exception {
        mockMvc.perform(put("/api/applications/app-1/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"ACCEPTED\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("SEC-CONTRACT-01: PUT /api/contracts/{id}/status requires authentication")
    void updateContractStatus_withoutToken_returns401() throws Exception {
        mockMvc.perform(put("/api/contracts/contract-1/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"IN_PROGRESS\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("SEC-CONTRACT-02: GET /api/contracts/my requires authentication")
    void getMyContracts_withoutToken_returns401() throws Exception {
        mockMvc.perform(get("/api/contracts/my"))
                .andExpect(status().isUnauthorized());
    }
}