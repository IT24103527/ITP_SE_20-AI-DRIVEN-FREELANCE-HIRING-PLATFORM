package com.example.talentflowbackend.service;
import com.example.talentflowbackend.dto.*;
import com.example.talentflowbackend.entity.*;
import com.example.talentflowbackend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {
    private final UserRepository repository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    public AuthResponse registerFreelancer(FreelancerRegRequest request) {
        var user = User.builder()
                .fullName(request.getFullName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .professionalTitle(request.getProfessionalTitle())
                .phoneNumber(request.getPhoneNumber())
                .skills(request.getSkills())
                .portfolioUrl(request.getPortfolioUrl())
                .bio(request.getBio())
                .role(Role.FREELANCER)
                .build();
        repository.save(user);
        var jwtToken = jwtService.generateToken(user);
        return AuthResponse.builder().token(jwtToken).role(user.getRole().name()).build();
    }

    public AuthResponse registerClient(ClientRegRequest request) {
        var user = User.builder()
                .fullName(request.getFullName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .companyName(request.getCompanyName())
                .phoneNumber(request.getPhoneNumber())
                .role(Role.CLIENT)
                .build();
        repository.save(user);
        var jwtToken = jwtService.generateToken(user);
        return AuthResponse.builder().token(jwtToken).role(user.getRole().name()).build();
    }

    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));
        var user = repository.findByEmail(request.getEmail()).orElseThrow();
        var jwtToken = jwtService.generateToken(user);
        return AuthResponse.builder().token(jwtToken).role(user.getRole().name()).build();
    }
    // Add this method to your existing AuthService.java
    public AuthResponse registerAdmin(AdminRegRequest request) {
        // Basic security: Only allow registration if a specific code is used
        if (!"TALENTAI_SECRET_2024".equals(request.getAdminCode())) {
            throw new RuntimeException("Invalid Admin Registration Code!");
        }

        var user = User.builder()
                .fullName(request.getFullName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .adminCode(request.getAdminCode())
                .role(Role.ADMIN)
                .build();

        repository.save(user);
        var jwtToken = jwtService.generateToken(user);
        return AuthResponse.builder().token(jwtToken).role(Role.ADMIN.name()).build();
    }
}
