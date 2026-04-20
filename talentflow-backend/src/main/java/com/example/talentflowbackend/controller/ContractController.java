package com.example.talentflowbackend.controller;

import com.example.talentflowbackend.entity.Contract;
import com.example.talentflowbackend.entity.Notification;
import com.example.talentflowbackend.entity.User;
import com.example.talentflowbackend.repository.ContractRepository;
import com.example.talentflowbackend.repository.NotificationRepository;
import com.example.talentflowbackend.repository.UserRepository;
import com.example.talentflowbackend.service.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Date;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/contracts")
@CrossOrigin(origins = "http://localhost:3000")
@RequiredArgsConstructor
public class ContractController {

    private final ContractRepository contractRepository;
    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final JwtService jwtService;

    @GetMapping("/my")
    public ResponseEntity<?> getMyContracts(@RequestHeader("Authorization") String authHeader) {
        try {
            String email = jwtService.extractUsername(authHeader.substring(7));
            User user = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));

            if (hasRole(user, "FREELANCER")) {
                List<Contract> contracts = contractRepository.findByFreelancerEmailOrderByUpdatedAtDesc(email);
                return ResponseEntity.ok(contracts);
            }

            if (hasRole(user, "CLIENT")) {
                List<Contract> contracts = contractRepository.findByClientEmailOrderByUpdatedAtDesc(email);
                return ResponseEntity.ok(contracts);
            }

            return ResponseEntity.status(403).body(Map.of("message", "Only clients and freelancers can view contracts"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/{contractId}/status")
    public ResponseEntity<?> updateContractStatus(
            @PathVariable String contractId,
            @RequestHeader("Authorization") String authHeader,
            @RequestBody Map<String, String> payload
    ) {
        try {
            String email = jwtService.extractUsername(authHeader.substring(7));
            User freelancer = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));

            if (!hasRole(freelancer, "FREELANCER")) {
                return ResponseEntity.status(403).body(Map.of("message", "Only freelancers can update contract progress"));
            }

            Contract contract = contractRepository.findById(contractId).orElseThrow(() -> new RuntimeException("Contract not found"));
            if (!email.equals(contract.getFreelancerEmail())) {
                return ResponseEntity.status(403).body(Map.of("message", "You do not have permission to update this contract"));
            }

            String newStatus = payload.getOrDefault("status", "").trim().toUpperCase();
            if (!newStatus.equals("STARTED") && !newStatus.equals("IN_PROGRESS") && !newStatus.equals("COMPLETED")) {
                return ResponseEntity.badRequest().body(Map.of("message", "Status must be STARTED, IN_PROGRESS or COMPLETED"));
            }

            contract.setStatus(newStatus);
            contract.setUpdatedAt(new Date());
            if ("STARTED".equals(newStatus) && contract.getStartedAt() == null) {
                contract.setStartedAt(new Date());
            }
            if ("COMPLETED".equals(newStatus)) {
                contract.setCompletedAt(new Date());
            }

            Contract updated = contractRepository.save(contract);

            String clientMessage = "Contract progress for '" + contract.getJobTitle() + "' is now " + newStatus + ".";
            Notification clientNotification = Notification.builder()
                    .recipientEmail(contract.getClientEmail())
                    .recipientRole("CLIENT")
                    .title("Contract Progress Updated")
                    .message(clientMessage)
                    .type("CONTRACT_PROGRESS")
                    .relatedContractId(contract.getId())
                    .createdAt(new Date())
                    .build();
            notificationRepository.save(clientNotification);

            return ResponseEntity.ok(Map.of(
                    "message", "Contract progress updated",
                    "contract", updated
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    private boolean hasRole(User user, String roleName) {
        return user.getRoles() != null && user.getRoles().stream().anyMatch(r -> r.name().equals(roleName));
    }
}
