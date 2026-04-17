package com.example.talentflowbackend.service;

import com.example.talentflowbackend.entity.SensitiveOtp;
import com.example.talentflowbackend.repository.SensitiveOtpRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.util.Date;
import java.util.Optional;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Slf4j
public class SensitiveActionOtpService {

    private static final Set<String> VALID_ACTIONS = Set.of("WITHDRAW", "CHANGE_EMAIL", "CHANGE_PASSWORD");
    private static final long OTP_TTL_MS = 5 * 60 * 1000L; // 5 minutes

    private final SensitiveOtpRepository sensitiveOtpRepository;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;

    /**
     * Generates a 6-digit OTP, stores its BCrypt hash, and emails it to the user.
     * Overwrites any existing pending OTP for the same email+action.
     */
    public void requestOtp(String email, String fullName, String action) {
        validateAction(action);

        int rawOtp = new SecureRandom().nextInt(900_000) + 100_000; // [100000, 999999]
        String rawOtpStr = String.valueOf(rawOtp);
        String otpHash = passwordEncoder.encode(rawOtpStr);

        // Upsert: delete any existing record for this email+action, then insert fresh
        sensitiveOtpRepository.deleteByEmailAndAction(email, action);

        SensitiveOtp record = SensitiveOtp.builder()
                .email(email)
                .action(action)
                .otpHash(otpHash)
                .expiresAt(new Date(System.currentTimeMillis() + OTP_TTL_MS))
                .used(false)
                .build();

        sensitiveOtpRepository.save(record);
        emailService.sendSensitiveActionOtpEmail(email, fullName, action, rawOtpStr);
        log.info("Sensitive OTP requested for email={} action={}", email, action);
    }

    /**
     * Verifies the submitted OTP against the stored hash.
     * Returns true only if the OTP is found, unused, not expired, and matches.
     * Marks the record as used on success.
     */
    public boolean verifyOtp(String email, String action, String submittedOtp) {
        validateAction(action);

        Optional<SensitiveOtp> opt = sensitiveOtpRepository.findByEmailAndAction(email, action);
        if (opt.isEmpty()) {
            return false;
        }

        SensitiveOtp record = opt.get();

        if (record.isUsed()) {
            return false;
        }

        if (record.getExpiresAt().before(new Date())) {
            sensitiveOtpRepository.delete(record);
            return false;
        }

        if (!passwordEncoder.matches(submittedOtp, record.getOtpHash())) {
            return false;
        }

        record.setUsed(true);
        sensitiveOtpRepository.save(record);
        log.info("Sensitive OTP verified for email={} action={}", email, action);
        return true;
    }

    private void validateAction(String action) {
        if (action == null || !VALID_ACTIONS.contains(action)) {
            throw new IllegalArgumentException(
                    "Invalid sensitive action: '" + action + "'. Must be one of: " + VALID_ACTIONS);
        }
    }
}
