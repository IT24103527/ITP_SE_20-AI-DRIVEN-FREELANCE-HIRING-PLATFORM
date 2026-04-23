package com.example.talentflowbackend.controller;
import com.example.talentflowbackend.entity.ProposalResponse;
import com.example.talentflowbackend.service.MlService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/client/jobs/{jobId}/proposals")
public class ProposalController {

    private final MlService mlService;

    public ProposalController(MlService mlService) {
        this.mlService = mlService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('CLIENT','ADMIN')")
    public List<ProposalResponse> getProposalsForJob(@PathVariable String jobId) {
        return mlService.getProposalsForJob(jobId);
    }
}