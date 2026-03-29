package com.example.talentflowbackend.controller;

import com.example.talentflowbackend.dto.PasswordChangeRequest;
import com.example.talentflowbackend.dto.ProfileUpdateRequest;
import com.example.talentflowbackend.entity.Role;
import com.example.talentflowbackend.entity.User;
import com.example.talentflowbackend.repository.UserRepository;
import com.example.talentflowbackend.service.JwtService;
import com.example.talentflowbackend.service.OtpService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Date;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/user")
@CrossOrigin(origins = "http://localhost:3000")
@RequiredArgsConstructor
public class UserProfileController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final OtpService otpService;

    // GET current user profile — passwords are @JsonIgnore, no manual nulling needed
    @GetMapping("/profile")
    public ResponseEntity<?> getProfile(@RequestHeader("Authorization") String authHeader) {
        try {
            String email = extractEmailFromHeader(authHeader);
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));
            // Include the active role from the JWT so the frontend can check data.role
            Role activeRole = extractRoleFromHeader(authHeader);
            Map<String, Object> response = new java.util.LinkedHashMap<>();
            response.put("id", user.getId());
            response.put("email", user.getEmail());
            response.put("fullName", user.getFullName());
            response.put("phoneNumber", user.getPhoneNumber());
            response.put("roles", user.getRoles() != null
                    ? user.getRoles().stream().map(Role::name).toList() : List.of());
            response.put("role", activeRole != null ? activeRole.name() : null);
            response.put("companyName", user.getCompanyName());
            response.put("industry", user.getIndustry());
            response.put("companySize", user.getCompanySize());
            response.put("professionalTitle", user.getProfessionalTitle());
            response.put("skills", user.getSkills());
            response.put("portfolioUrl", user.getPortfolioUrl());
            response.put("bio", user.getBio());
            response.put("hourlyRate", user.getHourlyRate());
            response.put("experience", user.getExperience());
            response.put("department", user.getDepartment());
            response.put("createdAt", user.getCreatedAt());
            response.put("isActive", user.getIsActive());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // UPDATE profile
    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody ProfileUpdateRequest request) {
        try {
            String email = extractEmailFromHeader(authHeader);
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            if (request.getFullName()         != null) user.setFullName(request.getFullName());
            if (request.getPhoneNumber()      != null) user.setPhoneNumber(request.getPhoneNumber());
            if (request.getCompanyName()      != null) user.setCompanyName(request.getCompanyName());
            if (request.getIndustry()         != null) user.setIndustry(request.getIndustry());
            if (request.getCompanySize()      != null) user.setCompanySize(request.getCompanySize());
            if (request.getProfessionalTitle()!= null) user.setProfessionalTitle(request.getProfessionalTitle());
            if (request.getSkills()           != null) user.setSkills(request.getSkills());
            if (request.getPortfolioUrl()     != null) user.setPortfolioUrl(request.getPortfolioUrl());
            if (request.getBio()              != null) user.setBio(request.getBio());
            if (request.getHourlyRate()       != null) user.setHourlyRate(request.getHourlyRate());
            if (request.getExperience()       != null) user.setExperience(request.getExperience());
            if (request.getDepartment()       != null) user.setDepartment(request.getDepartment());

            user.setUpdatedAt(new Date());
            userRepository.save(user);
            return ResponseEntity.ok(Map.of("message", "Profile updated successfully", "user", user));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // CHANGE password for the active role (requires TOTP + current password)
    @PutMapping("/change-password")
    public ResponseEntity<?> changePassword(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody PasswordChangeRequest request) {
        try {
            String email = extractEmailFromHeader(authHeader);
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            // Verify TOTP code
            if (user.getTotpSecret() == null || !otpService.verifyCode(user.getTotpSecret(), request.getOtp())) {
                return ResponseEntity.badRequest().body(Map.of("message", "Invalid authenticator code"));
            }

            // Determine active role from JWT claim
            Role activeRole = extractRoleFromHeader(authHeader);
            if (activeRole == null) {
                return ResponseEntity.badRequest().body(Map.of("message", "Could not determine active role from token"));
            }

            // Verify current role-specific password
            String storedPassword = user.getPasswordForRole(activeRole);
            if (storedPassword == null || !passwordEncoder.matches(request.getCurrentPassword(), storedPassword)) {
                return ResponseEntity.badRequest().body(Map.of("message", "Current password is incorrect"));
            }

            // Update only the active role's password
            user.setPasswordForRole(activeRole, passwordEncoder.encode(request.getNewPassword()));
            user.setUpdatedAt(new Date());
            userRepository.save(user);
            return ResponseEntity.ok(Map.of("message", "Password changed successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // DELETE account
    @DeleteMapping("/account")
    public ResponseEntity<?> deleteAccount(@RequestHeader("Authorization") String authHeader) {
        try {
            String email = extractEmailFromHeader(authHeader);
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));
            userRepository.delete(user);
            return ResponseEntity.ok(Map.of("message", "Account deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // GET all users (admin only)
    @GetMapping("/all")
    public ResponseEntity<List<User>> getAllUsers() {
        // Passwords are @JsonIgnore — no manual nulling needed
        return ResponseEntity.ok(userRepository.findAll());
    }

    private String extractEmailFromHeader(String authHeader) {
        return jwtService.extractUsername(authHeader.substring(7));
    }

    private Role extractRoleFromHeader(String authHeader) {
        try {
            String roleStr = jwtService.extractClaim(
                    authHeader.substring(7),
                    claims -> claims.get("role", String.class));
            return roleStr != null ? Role.valueOf(roleStr) : null;
        } catch (Exception e) {
            return null;
        }
    }
}
