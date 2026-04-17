package com.example.talentflowbackend.controller;

import com.example.talentflowbackend.dto.OtpVerifyRequest;
import com.example.talentflowbackend.entity.User;
import com.example.talentflowbackend.repository.UserRepository;
import com.example.talentflowbackend.service.OtpService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/otp")
@RequiredArgsConstructor
public class OtpController {

    private final OtpService otpService;
    private final UserRepository userRepository;

    // Verify a TOTP code for a given email (used by dashboard password change)
    @PostMapping("/verify")
    public ResponseEntity<?> verifyOtp(@RequestBody OtpVerifyRequest request) {
        User user = userRepository.findByEmail(request.getEmail()).orElse(null);
        if (user == null || user.getTotpSecret() == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "User not found or TOTP not set up", "verified", false));
        }
        boolean valid = otpService.verifyCode(user.getTotpSecret(), request.getOtp());
        if (valid) {
            return ResponseEntity.ok(Map.of("message", "Code verified", "verified", true));
        }
        return ResponseEntity.badRequest().body(Map.of("message", "Invalid or expired code", "verified", false));
    }
}
