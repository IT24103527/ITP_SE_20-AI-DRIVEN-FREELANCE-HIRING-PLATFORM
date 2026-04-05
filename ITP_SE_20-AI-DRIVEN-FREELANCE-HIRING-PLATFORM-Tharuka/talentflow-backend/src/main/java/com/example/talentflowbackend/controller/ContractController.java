package com.example.talentflowbackend.controller;

import com.example.talentflowbackend.entity.Contract;
import com.example.talentflowbackend.entity.User;
import com.example.talentflowbackend.repository.ContractRepository;
import com.example.talentflowbackend.repository.UserRepository;
import com.example.talentflowbackend.repository.NotificationRepository;
import com.example.talentflowbackend.entity.Notification;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/contracts")
@RequiredArgsConstructor
public class ContractController {

    private final ContractRepository contractRepository;
    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;
    private final com.example.talentflowbackend.service.JwtService jwtService;

    // GET my contracts (works for both Clients and Freelancers)
    @GetMapping("/my")
    @PreAuthorize("hasAnyRole('CLIENT', 'FREELANCER')")
    public ResponseEntity<?> getMyContracts(@RequestHeader("Authorization") String authHeader) {
        try {
            String email = jwtService.extractUsername(authHeader.substring(7));
            User user = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));
            
            List<Contract> contracts;
            // Check roles to determine search criteria
            boolean isClient = user.getRoles().stream().anyMatch(role -> role.name().equals("CLIENT"));
            
            if (isClient) {
                contracts = contractRepository.findByClientEmailOrderByCreatedAtDesc(email);
            } else {
                contracts = contractRepository.findByFreelancerEmailOrderByCreatedAtDesc(email);
            }
            return ResponseEntity.ok(contracts);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // UPDATE current situation (for freelancers)
    @PutMapping("/{id}/situation")
    @PreAuthorize("hasRole('FREELANCER')")
    public ResponseEntity<?> updateSituation(@PathVariable String id, @RequestBody Map<String, String> payload, @RequestHeader("Authorization") String authHeader) {
        try {
            String email = jwtService.extractUsername(authHeader.substring(7));
            String newSituation = payload.get("situation");
            
            if (newSituation == null || newSituation.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("message", "Situation update cannot be empty"));
            }

            Optional<Contract> contractOpt = contractRepository.findById(id);
            if (contractOpt.isPresent()) {
                Contract contract = contractOpt.get();
                
                // Security check: only the freelancer assigned to the contract can update situation
                if (!contract.getFreelancerEmail().equals(email)) {
                    return ResponseEntity.status(403).body(Map.of("message", "Only the assigned freelancer can update the contract situation"));
                }

                contract.setCurrentSituation(newSituation);
                contract.setUpdatedAt(new Date());
                contractRepository.save(contract);

                // Notify Client
                String message = String.format("Contract Update: Freelancer updated situation for '%s'.", 
                    contract.getJobTitle());
                Notification notif = Notification.builder()
                        .recipientEmail(contract.getClientEmail())
                        .message(message)
                        .type("INFO")
                        .contractId(contract.getId())
                        .isRead(false)
                        .createdAt(new Date())
                        .senderName(contract.getFreelancerName())
                        .build();
                notificationRepository.save(notif);

                return ResponseEntity.ok(contract);
            }
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // UPDATE contract status (e.g., to COMPLETED - usually by Client)
    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('CLIENT', 'FREELANCER')")
    public ResponseEntity<?> updateStatus(@PathVariable String id, @RequestBody Map<String, String> payload, @RequestHeader("Authorization") String authHeader) {
        try {
            String email = jwtService.extractUsername(authHeader.substring(7));
            String newStatus = payload.get("status"); // COMPLETED, CANCELLED
            
            if (newStatus == null) return ResponseEntity.badRequest().body(Map.of("message", "Status is required"));

            Optional<Contract> contractOpt = contractRepository.findById(id);
            if (contractOpt.isPresent()) {
                Contract contract = contractOpt.get();
                
                // Security check: only client involved can complete, or both can cancel?
                // For simplicity, let's allow both for now as it's a demo
                if (!contract.getClientEmail().equals(email) && !contract.getFreelancerEmail().equals(email)) {
                    return ResponseEntity.status(403).body(Map.of("message", "Not authorized to update this contract"));
                }

                contract.setStatus(newStatus);
                contract.setUpdatedAt(new Date());
                contractRepository.save(contract);
                return ResponseEntity.ok(contract);
            }
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
