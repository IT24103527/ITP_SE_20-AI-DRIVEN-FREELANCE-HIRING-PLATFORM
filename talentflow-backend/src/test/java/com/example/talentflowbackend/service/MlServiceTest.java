package com.example.talentflowbackend.service;

import com.example.talentflowbackend.dto.MLFeatures;
import com.example.talentflowbackend.dto.ProposalSubmitRequest;
import com.example.talentflowbackend.entity.*;
import com.example.talentflowbackend.repository.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.springframework.web.client.RestTemplate;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(org.mockito.junit.jupiter.MockitoExtension.class)
class MlServiceTest {

    @InjectMocks
    private MlService mlService;

    @Mock
    private FreelancerProfileRepository freelancerProfileRepository;

    @Mock
    private RestTemplate restTemplate;

    @Mock
    private JobPredictionRepository predictionRepository;

    @Mock
    private ProposalResponseRepository proposalResponseRepository;

    // =========================
    // ✅ VALIDATION TESTS
    // =========================

    @Test
    void shouldThrow_whenFreelancerProfileNotFound() {
        User user = new User();
        user.setId("USER001");

        when(freelancerProfileRepository.findByUserId("USER001")).thenReturn(null);

        RuntimeException ex = assertThrows(RuntimeException.class, () ->
                mlService.callmlserver(user, new ProposalSubmitRequest(), new Job(), new Application())
        );

        assertEquals("Freelancer not found", ex.getMessage());
    }

    @Test
    void shouldThrow_whenInvalidBudgetRatio() {
        User user = mockUser();
        FreelancerProfile profile = mockProfile(1, 5.0);

        when(freelancerProfileRepository.findByUserId(any())).thenReturn(profile);

        ProposalSubmitRequest req = new ProposalSubmitRequest();
        req.setProposedBudget(0.0);

        Job job = new Job();
        job.setBudget("1000");

        RuntimeException ex = assertThrows(RuntimeException.class, () ->
                mlService.callmlserver(user, req, job, new Application())
        );

        assertTrue(ex.getMessage().contains("Invalid budget ratio"));
    }

//    @Test
//    void shouldThrow_whenNoSkills() {
//        User user = mockUser();
//
//        FreelancerProfile profile = new FreelancerProfile();
//        profile.setSkills(new ArrayList<>());
//        profile.setRating(4.0);
//        profile.setCompletedJobs(5);
//
//        when(freelancerProfileRepository.findByUserId(any())).thenReturn(profile);
//
//        ProposalSubmitRequest req = new ProposalSubmitRequest();
//        req.setProposedBudget(1000.0);
//
//        Job job = new Job();
//        job.setBudget("1000");
//
//        RuntimeException ex = assertThrows(RuntimeException.class, () ->
//                mlService.callmlserver(user, req, job, new Application())
//        );
//
//        assertEquals("You need to add skills to get a prediction", ex.getMessage());
//    }

    // =========================
    // ✅ ML SERVICE FAILURE
    // =========================

    @Test
    void shouldThrow_whenMlServiceDown_successPrediction() {
        when(restTemplate.postForObject(contains("/predict/success"), any(), eq(Map.class)))
                .thenThrow(new RuntimeException());

        RuntimeException ex = assertThrows(RuntimeException.class, () ->
                mlService.predictSuccess(new MLFeatures())
        );

        assertEquals("Prediction service unavailable", ex.getMessage());
    }

    @Test
    void shouldThrow_whenMlServiceDown_budgetPrediction() {
        when(restTemplate.postForObject(contains("/predict/budget"), any(), eq(Map.class)))
                .thenThrow(new RuntimeException());

        RuntimeException ex = assertThrows(RuntimeException.class, () ->
                mlService.predictBudget(new MLFeatures())
        );

        assertEquals("Prediction service unavailable", ex.getMessage());
    }

    // =========================
    // ✅ ML RESPONSE VALIDATION
    // =========================

    @Test
    void shouldThrow_whenPredictionResponseNull() {
        RuntimeException ex = assertThrows(RuntimeException.class, () ->
                mlService.setPrediction(null)
        );

        assertEquals("Empty response from ML service", ex.getMessage());
    }

    @Test
    void shouldThrow_whenInvalidBudgetPrediction() {
        JobPrediction prediction = new JobPrediction();
        prediction.setEstimatedBudget(0.0);
        prediction.setSuccessProbability(0.5);

        RuntimeException ex = assertThrows(RuntimeException.class, () ->
                mlService.setPrediction(prediction)
        );

        assertEquals("Invalid budget prediction", ex.getMessage());
    }

    @Test
    void shouldThrow_whenInvalidProbability() {
        JobPrediction prediction = new JobPrediction();
        prediction.setEstimatedBudget(1000.0);
        prediction.setSuccessProbability(-1.0);

        RuntimeException ex = assertThrows(RuntimeException.class, () ->
                mlService.setPrediction(prediction)
        );

        assertEquals("Invalid probability value", ex.getMessage());
    }

    @Test
    void shouldSetMessage_highProbability() {
        JobPrediction prediction = new JobPrediction();
        prediction.setEstimatedBudget(1000.0);
        prediction.setSuccessProbability(0.8);

        JobPrediction result = mlService.setPrediction(prediction);

        assertEquals("High chance of success", result.getMessage());
    }

    // =========================
    // ✅ FULL FLOW TEST
    // =========================

    @Test
    void shouldExecuteFullFlowSuccessfully() {
        User user = mockUser();
        FreelancerProfile profile = mockProfile(2, 4.5);

        when(freelancerProfileRepository.findByUserId(any())).thenReturn(profile);

        ProposalSubmitRequest req = new ProposalSubmitRequest();
        req.setProposedBudget(1000.0);

        Job job = new Job();
        job.setId("job1");
        job.setBudget("1000");

        Application app = new Application();
        app.setId("app1");
        app.setJobId("job1");
        app.setFreelancerId("F001");

        Map<String, Object> successMap = new HashMap<>();
        successMap.put("successProbability", 0.8);

        Map<String, Object> budgetMap = new HashMap<>();
        budgetMap.put("estimatedBudget", 1200.0);

        when(restTemplate.postForObject(contains("/success"), any(), eq(Map.class)))
                .thenReturn(successMap);

        when(restTemplate.postForObject(contains("/budget"), any(), eq(Map.class)))
                .thenReturn(budgetMap);

        ProposalResponse response =
                mlService.callmlserver(user, req, job, app);

        assertNotNull(response);
        verify(predictionRepository, times(1)).save(any());
        verify(proposalResponseRepository, times(1)).save(any());
    }

    // =========================
    // 🔧 HELPERS
    // =========================

    private User mockUser() {
        User user = new User();
        user.setId("USER001");
        user.setFullName("user1");
        user.setSkills("Java");
        return user;
    }

    private FreelancerProfile mockProfile(int skills, double rating) {
        FreelancerProfile profile = new FreelancerProfile();
        profile.setSkills(Collections.nCopies(skills, "Java"));
        profile.setRating(rating);
        profile.setCompletedJobs(5);
        return profile;
    }
}

