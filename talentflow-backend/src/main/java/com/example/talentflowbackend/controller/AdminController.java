package com.example.talentflowbackend.controller;

import com.example.talentflowbackend.entity.Role;
import com.example.talentflowbackend.entity.User;
import com.example.talentflowbackend.repository.UserRepository;
import com.example.talentflowbackend.service.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final UserRepository userRepository;
    private final EmailService emailService;

    /** GET /api/admin/users — full details of every registered user */
    @GetMapping("/users")
    public ResponseEntity<List<Map<String, Object>>> getAllUsers() {
        List<User> users = userRepository.findAll();
        List<Map<String, Object>> result = new ArrayList<>();
        for (User u : users) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("id",               u.getId());
            row.put("fullName",         u.getFullName());
            row.put("email",            u.getEmail());
            row.put("phoneNumber",      u.getPhoneNumber());
            row.put("roles",            u.getRoles() != null
                    ? u.getRoles().stream().map(Role::name).toList() : List.of());
            row.put("isActive",         u.getIsActive());
            row.put("createdAt",        u.getCreatedAt());
            row.put("updatedAt",        u.getUpdatedAt());
            // Role-specific fields
            row.put("companyName",      u.getCompanyName());
            row.put("industry",         u.getIndustry());
            row.put("companySize",      u.getCompanySize());
            row.put("professionalTitle",u.getProfessionalTitle());
            row.put("skills",           u.getSkills());
            row.put("portfolioUrl",     u.getPortfolioUrl());
            row.put("bio",              u.getBio());
            row.put("hourlyRate",       u.getHourlyRate());
            row.put("experience",       u.getExperience());
            row.put("department",       u.getDepartment());
            // Brute-force state (useful for admins)
            row.put("failedLoginAttempts", u.getFailedLoginAttempts());
            row.put("failedOtpAttempts",   u.getFailedOtpAttempts());
            row.put("lockedUntil",         u.getLockedUntil());
            result.add(row);
        }
        return ResponseEntity.ok(result);
    }

    /** DELETE /api/admin/users/{id} — delete a user and notify them by email */
    @DeleteMapping("/users/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable String id) {
        Optional<User> opt = userRepository.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "User not found."));
        }
        User user = opt.get();
        String email    = user.getEmail();
        String fullName = user.getFullName();

        userRepository.deleteById(id);

        // Notify the deleted user asynchronously
        emailService.sendAccountDeletedByAdminEmail(email, fullName);

        return ResponseEntity.ok(Map.of("message", "User " + email + " has been deleted and notified."));
    }
}
