package com.example.talentflowbackend.controller;

import com.example.talentflowbackend.dto.*;
import com.example.talentflowbackend.entity.User;
import com.example.talentflowbackend.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register/client")
    public ResponseEntity<AuthResponse> registerClient(@Valid @RequestBody ClientRegRequest request) {
        return ResponseEntity.ok(authService.registerClient(request));
    }

    @PostMapping("/register/freelancer")
    public ResponseEntity<AuthResponse> registerFreelancer(@Valid @RequestBody FreelancerRegRequest request) {
        return ResponseEntity.ok(authService.registerFreelancer(request));
    }

    @PostMapping("/register/admin")
    public ResponseEntity<AuthResponse> registerAdmin(@Valid @RequestBody AdminRegRequest request) {
        return ResponseEntity.ok(authService.registerAdmin(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/verify-login-otp")
    public ResponseEntity<AuthResponse> verifyLoginOtp(@RequestBody LoginOtpVerifyRequest request) {
        return ResponseEntity.ok(authService.verifyLoginOtp(request.getEmail(), request.getOtp(), request.getRole()));
    }

    @PostMapping("/switch-role")
    public ResponseEntity<AuthResponse> switchRole(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody Map<String, String> request) {
        String newRole = request.get("role");
        return ResponseEntity.ok(authService.switchRole(authHeader, newRole));
    }

    @GetMapping("/users")
    public ResponseEntity<List<User>> getAllUsers() {
        List<User> users = authService.getAllUsers();
        // Passwords are @JsonIgnore on all three role-specific fields — no manual nulling needed
        return ResponseEntity.ok(users);
    }
}
