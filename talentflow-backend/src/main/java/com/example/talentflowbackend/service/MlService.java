package com.example.talentflowbackend.service;
import com.example.talentflowbackend.dto.MLFeatures;
import com.example.talentflowbackend.dto.ProposalSubmitRequest;
import com.example.talentflowbackend.entity.*;
import com.example.talentflowbackend.repository.FreelancerProfileRepository;
import com.example.talentflowbackend.repository.JobPredictionRepository;
import com.example.talentflowbackend.repository.ProposalResponseRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;

@Service
public class MlService {

    @Value("${ml.service.url}")
    private String mlServiceUrl;

    private final FreelancerProfileRepository freelancerProfileRepository;
    private final RestTemplate restTemplate;
    private final JobPredictionRepository predictionRepository;
    private final ProposalResponseRepository proposalResponseRepository;

    public MlService(FreelancerProfileRepository freelancerProfileRepository, RestTemplate restTemplate, JobPredictionRepository predictionRepository, ProposalResponseRepository proposalResponseRepository) {
        this.freelancerProfileRepository = freelancerProfileRepository;
        this.restTemplate = restTemplate;
        this.predictionRepository = predictionRepository;
        this.proposalResponseRepository = proposalResponseRepository;
    }

    public ProposalResponse callmlserver(User user, ProposalSubmitRequest request , Job job, Application saved){

        FreelancerProfile profile = freelancerProfileRepository.findByUserId(user.getId());
        if (profile == null) {
            throw new RuntimeException("Freelancer not found");
        }
        profile.setSkills(Collections.singletonList(user.getSkills()));
        freelancerProfileRepository.save(profile);

        // Build ML features
        MLFeatures features = new MLFeatures();
        features.setProposedBudget(request.getProposedBudget());
        features.setJobBudget(Double.parseDouble(job.getBudget()));
        features.setRating(profile.getRating() != null ? profile.getRating() : 0.0);
        features.setCompletedJobs(profile.getCompletedJobs() != null ? profile.getCompletedJobs() : 0);
        features.setSkillCount(profile.getSkills() != null ? profile.getSkills().size() : 0);
        try {
            features.setBudgetRatio(request.getProposedBudget() / Double.parseDouble(job.getBudget()));
        } catch (Exception e) {
            throw new RuntimeException("Invalid proposed price");
        }

        if ((features.getBudgetRatio() <= 0)) {
            throw new RuntimeException("Invalid budget ratio");
        }

        // 🔴 BUSINESS VALIDATION
        if (features.getSkillCount() == 0) {
            throw new RuntimeException("You need to add skills to get a prediction");
        }

        // Call ML service
        Map<String, Object> successResp = predictSuccess(features);
        Map<String, Object> budgetResp = predictBudget(features);

        // Save prediction
        JobPrediction prediction = new JobPrediction();
        prediction.setJobId(job.getId());
        prediction.setFreelancerId(user.getId());
        prediction.setSuccessProbability((Double) successResp.get("successProbability"));
        prediction.setEstimatedBudget((Double) budgetResp.get("estimatedBudget"));
        prediction.setPredictedAt(LocalDateTime.now());
        predictionRepository.save(prediction);

        setPrediction(prediction);

        // Build response
        ProposalResponse response = new ProposalResponse();
        response.setId(saved.getId());
        response.setJobId(saved.getJobId());
        response.setFreelancerId(saved.getFreelancerId());
        response.setFreelancerName(user.getUsername());
        response.setProposedPrice(request.getProposedBudget());
        response.setStatus(saved.getStatus());
        response.setSubmittedAt(saved.getUpdatedAt());
        response.setSuccessProbability(prediction.getSuccessProbability());
        response.setEstimatedBudget(prediction.getEstimatedBudget());
        response.setMessage(prediction.getMessage());

        proposalResponseRepository.save(response);

        return response;

    }


    public Map<String, Object> predictSuccess(MLFeatures features) {
        String url = mlServiceUrl + "/predict/success";
        try
        {
            return restTemplate.postForObject(url, features, Map.class);
        }
        catch (Exception e)
        {
            throw new RuntimeException("Prediction service unavailable");
        }
    }

    public Map<String, Object> predictBudget(MLFeatures features) {
        String url = mlServiceUrl + "/predict/budget";
        try {
            return restTemplate.postForObject(url, features, Map.class);
        }
        catch (Exception e){
            throw new RuntimeException("Prediction service unavailable");
        }
    }

    public JobPrediction setPrediction(JobPrediction response) {

        // ⚠️ RESPONSE VALIDATION
        if (response == null) {
            throw new RuntimeException("Empty response from ML service");
        }

        if (response.getEstimatedBudget() <= 0|| response.getEstimatedBudget()==null) {
            throw new RuntimeException("Invalid budget prediction");
        }

        if (response.getSuccessProbability() < 0) {
            throw new RuntimeException("Invalid probability value");
        }

        // 💰 RANGE CALCULATION
        double budget = response.getEstimatedBudget();
        double lower = budget * 0.9;
        double upper = budget * 1.1;
        response.setBudgetRange((int) lower + " - " + (int) upper);

        // 📊 MESSAGE LOGIC
        double prob = response.getSuccessProbability();
        if (prob > 0.7) {
            response.setMessage("High chance of success");
        } else if (prob > 0.4) {
            response.setMessage("Moderate chance");
        } else {
            response.setMessage("Low probability - improve your proposal");
        }

        return response;
    }

    // Get all proposals for a job (client only)
    public List<ProposalResponse> getProposalsForJob(String jobId){
        List<ProposalResponse> responseList = new ArrayList<>();
        responseList = proposalResponseRepository.findByJobId(jobId);
        return responseList;
    }
}
