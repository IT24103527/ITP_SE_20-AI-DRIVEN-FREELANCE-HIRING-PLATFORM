package com.example.talentflowbackend.controller;

import com.example.talentflowbackend.dto.SensitiveOtpRequest;
import com.example.talentflowbackend.dto.SensitiveOtpVerifyRequest;
import com.example.talentflowbackend.entity.User;
import com.example.talentflowbackend.repository.UserRepository;
import com.example.talentflowbackend.service.SensitiveActionOtpService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/sensitive")
@RequiredArgsConstructor
public class SensitiveActionController {

    private final SensitiveActionOtpService sensitiveActionOtpService;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    /**
     * POST /api/sensitive/request-otp
     * Authenticated. Generates and emails a 6-digit OTP for the requested sensitive action.
     */
    @PostMapping("/request-otp")
    public ResponseEntity<?> requestOtp(@Valid @RequestBody SensitiveOtpRequest request) {
        String email = getAuthenticatedEmail();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        sensitiveActionOtpService.requestOtp(email, user.getFullName(), request.getAction());
        return ResponseEntity.ok(Map.of("message", "Verification code sent to your registered email."));
    }

    /**
     * POST /api/sensitive/verify-otp
     * Authenticated. Verifies the OTP and executes the sensitive action on success.
     */
    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@Valid @RequestBody SensitiveOtpVerifyRequest request) {
        String email = getAuthenticatedEmail();

        boolean valid = sensitiveActionOtpService.verifyOtp(email, request.getAction(), request.getOtp());
        if (!valid) {
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid or expired verification code."));
        }

        return switch (request.getAction()) {
            case "CHANGE_PASSWORD" -> handleChangePassword(email, request);
            case "CHANGE_EMAIL"    -> handleChangeEmail(email, request);
            case "WITHDRAW"        -> handleWithdraw(email, request);
            default -> ResponseEntity.badRequest().body(Map.of("message", "Unknown action."));
        };
    }

    // ── Action handlers ───────────────────────────────────────────

    private ResponseEntity<?> handleChangePassword(String email, SensitiveOtpVerifyRequest req) {
        if (req.getNewPassword() == null || req.getNewPassword().length() < 8) {
            return ResponseEntity.badRequest().body(Map.of("message", "New password must be at least 8 characters."));
        }
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        // Update all role-specific passwords that are currently set
        if (user.getClientPassword()     != null) user.setClientPassword(passwordEncoder.encode(req.getNewPassword()));
        if (user.getFreelancerPassword() != null) user.setFreelancerPassword(passwordEncoder.encode(req.getNewPassword()));
        if (user.getAdminPassword()      != null) user.setAdminPassword(passwordEncoder.encode(req.getNewPassword()));
        userRepository.save(user);
        return ResponseEntity.ok(Map.of("message", "Password changed successfully."));
    }

    private ResponseEntity<?> handleChangeEmail(String email, SensitiveOtpVerifyRequest req) {
        if (req.getNewEmail() == null || !req.getNewEmail().contains("@")) {
            return ResponseEntity.badRequest().body(Map.of("message", "A valid new email address is required."));
        }
        if (userRepository.findByEmail(req.getNewEmail()).isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email address is already in use."));
        }
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setEmail(req.getNewEmail());
        userRepository.save(user);
        return ResponseEntity.ok(Map.of("message", "Email address updated successfully."));
    }

    private ResponseEntity<?> handleWithdraw(String email, SensitiveOtpVerifyRequest req) {
        if (req.getAmount() == null || req.getAmount() <= 0) {
            return ResponseEntity.badRequest().body(Map.of("message", "A valid withdrawal amount is required."));
        }
        // Withdrawal business logic would be implemented here when the payments module is built.
        // For now, return a success acknowledgement to confirm OTP verification works end-to-end.
        return ResponseEntity.ok(Map.of(
                "message", "Withdrawal authorised.",
                "amount", req.getAmount(),
                "bankDetails", req.getBankDetails() != null ? req.getBankDetails() : "N/A"
        ));
    }

    private String getAuthenticatedEmail() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth.getName(); // Spring Security sets the email as the principal name via JwtAuthenticationFilter
    }
}
