package com.example.talentflowbackend.controller;

import com.example.talentflowbackend.dto.*;
import com.example.talentflowbackend.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register/freelancer")
    public ResponseEntity<AuthResponse> registerFreelancer(@RequestBody FreelancerRegRequest request) {
        return ResponseEntity.ok(authService.registerFreelancer(request));
    }

    @PostMapping("/register/client")
    public ResponseEntity<AuthResponse> registerClient(@RequestBody ClientRegRequest request) {
        return ResponseEntity.ok(authService.registerClient(request));
    }

    @PostMapping("/register/admin")
    public ResponseEntity<AuthResponse> registerAdmin(@RequestBody AdminRegRequest request) {
        return ResponseEntity.ok(authService.registerAdmin(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }
}
