package com.example.talentflowbackend.service;

import dev.samstevens.totp.code.*;
import dev.samstevens.totp.qr.QrData;
import dev.samstevens.totp.qr.QrGenerator;
import dev.samstevens.totp.qr.ZxingPngQrGenerator;
import dev.samstevens.totp.secret.DefaultSecretGenerator;
import dev.samstevens.totp.secret.SecretGenerator;
import dev.samstevens.totp.time.SystemTimeProvider;
import dev.samstevens.totp.time.TimeProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import static dev.samstevens.totp.util.Utils.getDataUriForImage;

@Service
public class OtpService {

    @Value("${totp.issuer}")
    private String issuer;

    private final SecretGenerator secretGenerator = new DefaultSecretGenerator();
    private final TimeProvider timeProvider = new SystemTimeProvider();
    private final CodeGenerator codeGenerator = new DefaultCodeGenerator();
    private final CodeVerifier codeVerifier = new DefaultCodeVerifier(codeGenerator, timeProvider);

    // ── Generate a new TOTP secret for a user ──
    public String generateSecret() {
        return secretGenerator.generate();
    }

    // ── Generate QR code data URI for the authenticator app ──
    public String generateQrCodeDataUri(String email, String secret) {
        try {
            QrData data = new QrData.Builder()
                    .label(email)
                    .secret(secret)
                    .issuer(issuer)
                    .algorithm(HashingAlgorithm.SHA1)
                    .digits(6)
                    .period(30)
                    .build();

            QrGenerator generator = new ZxingPngQrGenerator();
            byte[] imageData = generator.generate(data);
            return getDataUriForImage(imageData, generator.getImageMimeType());
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate QR code: " + e.getMessage());
        }
    }

    // ── Verify a 6-digit TOTP code against the user's secret ──
    public boolean verifyCode(String secret, String code) {
        try {
            return codeVerifier.isValidCode(secret, code);
        } catch (Exception e) {
            return false;
        }
    }
}
