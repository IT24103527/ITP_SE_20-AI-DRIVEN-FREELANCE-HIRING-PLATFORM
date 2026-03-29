package com.example.talentflowbackend.controller;

import com.example.talentflowbackend.dto.AdminRegRequest;
import com.example.talentflowbackend.dto.AuthResponse;
import com.example.talentflowbackend.dto.ClientRegRequest;
import com.example.talentflowbackend.dto.FreelancerRegRequest;
import com.example.talentflowbackend.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

// This controller mirrors /api/auth for legacy frontend compatibility
@RestController
@RequestMapping("/api/v1/auth")
@CrossOrigin(origins = "http://localhost:3000")
@RequiredArgsConstructor
public class RegistrationController {

    private final AuthService authService;

    @PostMapping("/register/client")
    public ResponseEntity<AuthResponse> registerClient(@RequestBody ClientRegRequest request) {
        return ResponseEntity.ok(authService.registerClient(request));
    }

    @PostMapping("/register/freelancer")
    public ResponseEntity<AuthResponse> registerFreelancer(@RequestBody FreelancerRegRequest request) {
        return ResponseEntity.ok(authService.registerFreelancer(request));
    }

    @PostMapping("/register/admin")
    public ResponseEntity<AuthResponse> registerAdmin(@RequestBody AdminRegRequest request) {
        return ResponseEntity.ok(authService.registerAdmin(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody com.example.talentflowbackend.dto.LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }
}
