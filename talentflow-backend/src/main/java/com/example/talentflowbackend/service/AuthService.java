package com.example.talentflowbackend.service;

import com.example.talentflowbackend.dto.*;
import com.example.talentflowbackend.entity.Role;
import com.example.talentflowbackend.entity.User;
import com.example.talentflowbackend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final OtpService otpService;
    private final EmailService emailService;
    private final TokenRefreshService tokenRefreshService;

    @Value("${admin.registration.code}")
    private String adminRegistrationCode;

    private static final int    MAX_ATTEMPTS    = 3;
    private static final long   LOCK_DURATION_MS = 60_000L; // 1 minute

    // ─────────────────────────────────────────────────────────────
    // REGISTRATION
    // ─────────────────────────────────────────────────────────────

    public AuthResponse registerClient(ClientRegRequest req) {
        try {
            Optional<User> existing = userRepository.findByEmail(req.getEmail());
            if (existing.isPresent()) {
                User user = existing.get();
                if (user.hasRole(Role.CLIENT))
                    return AuthResponse.builder().message("A Client account already exists for this email.").build();
                user.addRole(Role.CLIENT);
                user.setPasswordForRole(Role.CLIENT, passwordEncoder.encode(req.getPassword()));
                if (req.getCompanyName() != null) user.setCompanyName(req.getCompanyName());
                user.setUpdatedAt(new Date());
                userRepository.save(user);
                emailService.sendClientRegistrationEmail(req.getEmail(), user.getFullName());
                return AuthResponse.builder()
                        .message("Client account created! Use your new Client password + authenticator app to log in.")
                        .role("CLIENT").build();
            }
            String totpSecret = otpService.generateSecret();
            User user = User.builder()
                    .fullName(req.getFullName()).email(req.getEmail())
                    .clientPassword(passwordEncoder.encode(req.getPassword()))
                    .phoneNumber(req.getPhoneNumber()).companyName(req.getCompanyName())
                    .totpSecret(totpSecret).roles(new HashSet<>(Set.of(Role.CLIENT)))
                    .createdAt(new Date()).updatedAt(new Date()).isActive(true).build();
            userRepository.save(user);
            String qrCode = otpService.generateQrCodeDataUri(req.getEmail(), totpSecret);
            emailService.sendClientRegistrationEmail(req.getEmail(), req.getFullName());
            return AuthResponse.builder().message("Client registered. Scan the QR code with your authenticator app.")
                    .role("CLIENT").qrCode(qrCode).totpSecret(totpSecret).build();
        } catch (Exception e) {
            return AuthResponse.builder().message("Registration failed: " + e.getMessage()).build();
        }
    }

    public AuthResponse registerFreelancer(FreelancerRegRequest req) {
        try {
            Optional<User> existing = userRepository.findByEmail(req.getEmail());
            if (existing.isPresent()) {
                User user = existing.get();
                if (user.hasRole(Role.FREELANCER))
                    return AuthResponse.builder().message("A Freelancer account already exists for this email.").build();
                user.addRole(Role.FREELANCER);
                user.setPasswordForRole(Role.FREELANCER, passwordEncoder.encode(req.getPassword()));
                if (req.getProfessionalTitle() != null) user.setProfessionalTitle(req.getProfessionalTitle());
                if (req.getSkills()            != null) user.setSkills(req.getSkills());
                if (req.getPortfolioUrl()      != null) user.setPortfolioUrl(req.getPortfolioUrl());
                if (req.getBio()               != null) user.setBio(req.getBio());
                if (req.getHourlyRate()        != null) user.setHourlyRate(req.getHourlyRate());
                if (req.getExperience()        != null) user.setExperience(req.getExperience());
                user.setUpdatedAt(new Date());
                userRepository.save(user);
                emailService.sendFreelancerRegistrationEmail(req.getEmail(), user.getFullName());
                return AuthResponse.builder()
                        .message("Freelancer account created! Use your new Freelancer password + authenticator app to log in.")
                        .role("FREELANCER").build();
            }
            String totpSecret = otpService.generateSecret();
            User user = User.builder()
                    .fullName(req.getFullName()).email(req.getEmail())
                    .freelancerPassword(passwordEncoder.encode(req.getPassword()))
                    .phoneNumber(req.getPhoneNumber()).professionalTitle(req.getProfessionalTitle())
                    .skills(req.getSkills()).portfolioUrl(req.getPortfolioUrl()).bio(req.getBio())
                    .hourlyRate(req.getHourlyRate()).experience(req.getExperience())
                    .totpSecret(totpSecret).roles(new HashSet<>(Set.of(Role.FREELANCER)))
                    .createdAt(new Date()).updatedAt(new Date()).isActive(true).build();
            userRepository.save(user);
            String qrCode = otpService.generateQrCodeDataUri(req.getEmail(), totpSecret);
            emailService.sendFreelancerRegistrationEmail(req.getEmail(), req.getFullName());
            return AuthResponse.builder().message("Freelancer registered. Scan the QR code with your authenticator app.")
                    .role("FREELANCER").qrCode(qrCode).totpSecret(totpSecret).build();
        } catch (Exception e) {
            return AuthResponse.builder().message("Registration failed: " + e.getMessage()).build();
        }
    }

    public AuthResponse registerAdmin(AdminRegRequest req) {
        try {
            if (!adminRegistrationCode.equals(req.getAdminCode()))
                return AuthResponse.builder().message("Invalid admin registration code.").build();
            Optional<User> existing = userRepository.findByEmail(req.getEmail());
            if (existing.isPresent()) {
                User user = existing.get();
                if (user.hasRole(Role.ADMIN))
                    return AuthResponse.builder().message("An Admin account already exists for this email.").build();
                user.addRole(Role.ADMIN);
                user.setPasswordForRole(Role.ADMIN, passwordEncoder.encode(req.getPassword()));
                if (req.getDepartment() != null) user.setDepartment(req.getDepartment());
                user.setAdminCode(req.getAdminCode());
                user.setUpdatedAt(new Date());
                userRepository.save(user);
                emailService.sendAdminRegistrationEmail(req.getEmail(), user.getFullName());
                return AuthResponse.builder()
                        .message("Admin account created! Use your new Admin password + authenticator app to log in.")
                        .role("ADMIN").build();
            }
            String totpSecret = otpService.generateSecret();
            User user = User.builder()
                    .fullName(req.getFullName()).email(req.getEmail())
                    .adminPassword(passwordEncoder.encode(req.getPassword()))
                    .phoneNumber(req.getPhoneNumber()).adminCode(req.getAdminCode())
                    .department(req.getDepartment()).totpSecret(totpSecret)
                    .roles(new HashSet<>(Set.of(Role.ADMIN)))
                    .createdAt(new Date()).updatedAt(new Date()).isActive(true).build();
            userRepository.save(user);
            String qrCode = otpService.generateQrCodeDataUri(req.getEmail(), totpSecret);
            emailService.sendAdminRegistrationEmail(req.getEmail(), req.getFullName());
            return AuthResponse.builder().message("Admin registered. Scan the QR code with your authenticator app.")
                    .role("ADMIN").qrCode(qrCode).totpSecret(totpSecret).build();
        } catch (Exception e) {
            return AuthResponse.builder().message("Registration failed: " + e.getMessage()).build();
        }
    }

    // ─────────────────────────────────────────────────────────────
    // LOGIN STEP 1 — validate email + role-specific password
    // Locks after MAX_ATTEMPTS failed password attempts.
    // ─────────────────────────────────────────────────────────────

    public AuthResponse login(LoginRequest request) {
        try {
            Role requestedRole = parseRole(request.getRole());
            if (requestedRole == null)
                return AuthResponse.builder().message("Role is required to log in.").build();

            User user = userRepository.findByEmail(request.getEmail()).orElse(null);
            if (user == null || Boolean.FALSE.equals(user.getIsActive()))
                return AuthResponse.builder().message("Invalid email or password.").build();

            // ── Check lock ──
            if (user.isLocked()) {
                return AuthResponse.builder()
                        .message("Account is locked. Please wait " + user.lockSecondsRemaining() + " second(s) before trying again.")
                        .locked(true)
                        .lockSecondsRemaining(user.lockSecondsRemaining())
                        .build();
            }

            if (!user.hasRole(requestedRole))
                return AuthResponse.builder()
                        .message("No " + requestedRole.name() + " account found for this email. Please register first.")
                        .build();

            // ── Validate role-specific password ──
            String storedPassword = user.getPasswordForRole(requestedRole);
            if (storedPassword == null || !passwordEncoder.matches(request.getPassword(), storedPassword)) {
                int attempts = user.getFailedLoginAttempts() + 1;
                user.setFailedLoginAttempts(attempts);

                if (attempts >= MAX_ATTEMPTS) {
                    user.setLockedUntil(new Date(System.currentTimeMillis() + LOCK_DURATION_MS));
                    user.setFailedLoginAttempts(0);
                    userRepository.save(user);
                    emailService.sendAccountLockedEmail(user.getEmail(), user.getFullName(),
                            "Too many failed password attempts (" + MAX_ATTEMPTS + " in a row).",
                            LOCK_DURATION_MS / 1000);
                    return AuthResponse.builder()
                            .message("Account locked for 1 minute due to " + MAX_ATTEMPTS + " failed login attempts. A notification has been sent to your email.")
                            .locked(true).lockSecondsRemaining(60L).build();
                }

                userRepository.save(user);
                int remaining = MAX_ATTEMPTS - attempts;
                return AuthResponse.builder()
                        .message("Invalid email or password. " + remaining + " attempt(s) remaining before account lock.")
                        .build();
            }

            // ── Password correct — reset login counter ──
            user.setFailedLoginAttempts(0);
            userRepository.save(user);

            return AuthResponse.builder()
                    .message("Credentials verified. Enter the 6-digit code from your authenticator app.")
                    .roles(user.getRoles() != null
                            ? user.getRoles().stream().map(Role::name).toList()
                            : List.of())
                    .otpRequired(true)
                    .build();

        } catch (Exception e) {
            return AuthResponse.builder().message("Login failed: " + e.getMessage()).build();
        }
    }

    // ─────────────────────────────────────────────────────────────
    // LOGIN STEP 2 — verify TOTP → issue JWT
    // Locks after MAX_ATTEMPTS failed OTP attempts.
    // ─────────────────────────────────────────────────────────────

    public AuthResponse verifyLoginOtp(String email, String code, String requestedRoleStr) {
        try {
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new IllegalArgumentException("User not found"));

            // ── Check lock ──
            if (user.isLocked()) {
                return AuthResponse.builder()
                        .message("Account is locked. Please wait " + user.lockSecondsRemaining() + " second(s) before trying again.")
                        .locked(true)
                        .lockSecondsRemaining(user.lockSecondsRemaining())
                        .build();
            }

            if (user.getTotpSecret() == null)
                return AuthResponse.builder().message("TOTP not set up. Please re-register to get a QR code.").build();

            // ── Verify TOTP code ──
            if (!otpService.verifyCode(user.getTotpSecret(), code)) {
                int attempts = user.getFailedOtpAttempts() + 1;
                user.setFailedOtpAttempts(attempts);

                if (attempts >= MAX_ATTEMPTS) {
                    user.setLockedUntil(new Date(System.currentTimeMillis() + LOCK_DURATION_MS));
                    user.setFailedOtpAttempts(0);
                    userRepository.save(user);
                    emailService.sendAccountLockedEmail(user.getEmail(), user.getFullName(),
                            "Too many failed authenticator code attempts (" + MAX_ATTEMPTS + " in a row).",
                            LOCK_DURATION_MS / 1000);
                    return AuthResponse.builder()
                            .message("Account locked for 1 minute due to " + MAX_ATTEMPTS + " failed OTP attempts. A notification has been sent to your email.")
                            .locked(true).lockSecondsRemaining(60L).build();
                }

                userRepository.save(user);
                int remaining = MAX_ATTEMPTS - attempts;
                return AuthResponse.builder()
                        .message("Invalid or expired code. " + remaining + " attempt(s) remaining before account lock.")
                        .build();
            }

            // ── OTP correct — reset OTP counter ──
            user.setFailedOtpAttempts(0);

            Role activeRole = parseRole(requestedRoleStr);
            if (activeRole == null || !user.hasRole(activeRole))
                return AuthResponse.builder().message("Invalid role for this account.").build();

            user.setUpdatedAt(new Date());
            userRepository.save(user);  // saves both OTP reset and updatedAt

            String jwtToken = jwtService.generateToken(user, activeRole);

            switch (activeRole) {
                case CLIENT     -> emailService.sendClientLoginEmail(user.getEmail(), user.getFullName());
                case FREELANCER -> emailService.sendFreelancerLoginEmail(user.getEmail(), user.getFullName());
                case ADMIN      -> emailService.sendAdminLoginEmail(user.getEmail(), user.getFullName());
            }

            TokenPair tokenPair = tokenRefreshService.issueTokenPair(user, activeRole);

            return AuthResponse.builder()
                    .token(jwtToken).message("Login successful")
                    .role(activeRole.name())
                    .refreshToken(tokenPair.refreshToken())
                    .roles(user.getRoles() != null
                            ? user.getRoles().stream().map(Role::name).toList()
                            : List.of())
                    .user(user).fullName(user.getFullName())
                    .build();

        } catch (Exception e) {
            return AuthResponse.builder().message("Verification failed: " + e.getMessage()).build();
        }
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    private Role parseRole(String roleStr) {
        if (roleStr == null || roleStr.isBlank()) return null;
        try { return Role.valueOf(roleStr.toUpperCase()); }
        catch (IllegalArgumentException e) { return null; }
    }
}
