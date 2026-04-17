package com.example.talentflowbackend.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import jakarta.mail.internet.MimeMessage;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.mail.from}")
    private String fromAddress;

    // ── shared send helper (package-private — used by tests and @Async public methods) ──
    void send(String to, String subject, String htmlBody) {
        try {
            MimeMessage msg = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(msg, true, "UTF-8");
            helper.setFrom(fromAddress, "TalentFlowAI");
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlBody, true);
            mailSender.send(msg);
            log.info("Email sent → {} | {}", to, subject);
        } catch (Exception e) {
            log.error("Failed to send email to {}: {}", to, e.getMessage());
        }
    }

    // ── REGISTRATION emails ───────────────────────────────────────

    @Async
    public void sendClientRegistrationEmail(String to, String fullName) {
        send(to, "🎉 Welcome to TalentFlowAI — Your Client Account is Ready!",
                registrationTemplate(fullName, "Client",
                        "You can now post jobs, browse AI-matched freelancers, and manage your projects — all from one powerful dashboard.",
                        "#4361ee",
                        new String[]{"Post unlimited job listings", "AI-powered freelancer matching", "Secure escrow payments", "Real-time project tracking"}));
    }

    @Async
    public void sendFreelancerRegistrationEmail(String to, String fullName) {
        send(to, "🎉 Welcome to TalentFlowAI — Your Freelancer Account is Ready!",
                registrationTemplate(fullName, "Freelancer",
                        "Your profile is live! Our AI will now match you with projects that perfectly align with your skills and experience.",
                        "#667eea",
                        new String[]{"AI-matched project recommendations", "Showcase your portfolio & skills", "Secure milestone-based payments", "Build your reputation with verified reviews"}));
    }

    @Async
    public void sendAdminRegistrationEmail(String to, String fullName) {
        send(to, "🎉 Welcome to TalentFlowAI — Your Admin Account is Ready!",
                registrationTemplate(fullName, "Administrator",
                        "Your admin account has been activated. You now have full access to platform management, user oversight, and analytics.",
                        "#f093fb",
                        new String[]{"Full user management access", "Platform-wide analytics dashboard", "Role-based access control", "Security & audit log monitoring"}));
    }

    // ── ACCOUNT LOCKED email ─────────────────────────────────────

    @Async
    public void sendAccountLockedEmail(String to, String fullName, String reason, long secondsRemaining) {
        String minutes = secondsRemaining > 60
                ? (secondsRemaining / 60) + " minute(s)"
                : secondsRemaining + " second(s)";
        send(to, "🔒 Account Temporarily Locked — TalentFlowAI",
                baseTemplate("#ef4444", """
                    <h1 style="margin:0 0 8px;font-size:26px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">
                      Account Locked 🔒
                    </h1>
                    <p style="margin:0 0 24px;color:#94a3b8;font-size:15px;line-height:1.6;">
                      Hi <strong style="color:#ffffff;">%s</strong>,
                    </p>
                    <div style="background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.3);border-radius:12px;padding:20px 24px;margin-bottom:24px;">
                      <p style="margin:0 0 12px;color:#fca5a5;font-size:14px;font-weight:600;">%s</p>
                      <p style="margin:0;color:#94a3b8;font-size:13px;line-height:1.6;">
                        Your account has been temporarily locked for <strong style="color:#fff;">%s</strong>
                        to protect against unauthorised access. It will unlock automatically after this period.
                      </p>
                    </div>
                    <p style="margin:0 0 24px;color:#94a3b8;font-size:13px;line-height:1.6;">
                      If this was not you, your account may be under attack. Please contact us immediately.
                    </p>
                    <p style="margin:0;color:#475569;font-size:12px;">
                      Contact support at
                      <a href="mailto:support@talentflowai.lk" style="color:#ef4444;">support@talentflowai.lk</a>
                    </p>
                    """.formatted(fullName, reason, minutes)));
    }

    // ── SENSITIVE ACTION OTP email ────────────────────────────────

    @Async
    public void sendSensitiveActionOtpEmail(String to, String fullName, String action, String otp) {
        String actionLabel = switch (action) {
            case "WITHDRAW"        -> "Fund Withdrawal";
            case "CHANGE_EMAIL"    -> "Email Address Change";
            case "CHANGE_PASSWORD" -> "Password Change";
            default                -> action;
        };
        send(to, "🔐 Verification Code — " + actionLabel + " | TalentFlowAI",
                baseTemplate("#f59e0b", """
                    <h1 style="margin:0 0 8px;font-size:26px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">
                      Action Verification Required 🔐
                    </h1>
                    <p style="margin:0 0 24px;color:#94a3b8;font-size:15px;line-height:1.6;">
                      Hi <strong style="color:#ffffff;">%s</strong>,
                    </p>
                    <p style="margin:0 0 16px;color:#94a3b8;font-size:14px;line-height:1.6;">
                      A verification code has been requested to authorise the following action on your account:
                    </p>
                    <div style="background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.3);border-radius:12px;padding:20px 24px;margin-bottom:24px;text-align:center;">
                      <p style="margin:0 0 8px;color:#fbbf24;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;">
                        Action: %s
                      </p>
                      <p style="margin:0;font-size:40px;font-weight:800;color:#ffffff;letter-spacing:0.3em;">%s</p>
                      <p style="margin:8px 0 0;color:#94a3b8;font-size:12px;">This code expires in 5 minutes</p>
                    </div>
                    <p style="margin:0 0 24px;color:#94a3b8;font-size:13px;line-height:1.6;">
                      If you did not request this action, please ignore this email and consider changing your password immediately.
                    </p>
                    <p style="margin:0;color:#475569;font-size:12px;">
                      Contact support at
                      <a href="mailto:support@talentflowai.lk" style="color:#f59e0b;">support@talentflowai.lk</a>
                    </p>
                    """.formatted(fullName, actionLabel, otp)));
    }

    // ── ACCOUNT DELETED BY ADMIN email ───────────────────────────

    @Async
    public void sendAccountDeletedByAdminEmail(String to, String fullName) {
        send(to, "⚠️ Your TalentFlowAI Account Has Been Removed",
                baseTemplate("#ef4444", """
                    <h1 style="margin:0 0 8px;font-size:26px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">
                      Account Removed ⚠️
                    </h1>
                    <p style="margin:0 0 24px;color:#94a3b8;font-size:15px;line-height:1.6;">
                      Hi <strong style="color:#ffffff;">%s</strong>,
                    </p>
                    <div style="background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.3);border-radius:12px;padding:20px 24px;margin-bottom:24px;">
                      <p style="margin:0 0 12px;color:#fca5a5;font-size:14px;font-weight:600;">Your account has been permanently deleted by a platform administrator.</p>
                      <p style="margin:0;color:#94a3b8;font-size:13px;line-height:1.6;">
                        All your data, including your profile, credentials, and associated records, has been removed from the TalentFlowAI platform.
                        This action cannot be undone.
                      </p>
                    </div>
                    <p style="margin:0 0 24px;color:#94a3b8;font-size:13px;line-height:1.6;">
                      If you believe this was done in error or you have questions, please contact our support team immediately.
                    </p>
                    <p style="margin:0;color:#475569;font-size:12px;">
                      Contact support at
                      <a href="mailto:support@talentflowai.lk" style="color:#ef4444;">support@talentflowai.lk</a>
                    </p>
                    """.formatted(fullName)));
    }

    // ── LOGIN SUCCESS emails ──────────────────────────────────────

    @Async
    public void sendClientLoginEmail(String to, String fullName) {
        send(to, "✅ Successful Login — TalentFlowAI Client Portal",
                loginTemplate(fullName, "Client", "#4361ee",
                        "You've successfully signed in to your Client dashboard. If this wasn't you, please secure your account immediately."));
    }

    @Async
    public void sendFreelancerLoginEmail(String to, String fullName) {
        send(to, "✅ Successful Login — TalentFlowAI Freelancer Portal",
                loginTemplate(fullName, "Freelancer", "#667eea",
                        "You've successfully signed in to your Freelancer dashboard. New project matches may be waiting for you!"));
    }

    @Async
    public void sendAdminLoginEmail(String to, String fullName) {
        send(to, "✅ Successful Login — TalentFlowAI Admin Portal",
                loginTemplate(fullName, "Administrator", "#f093fb",
                        "You've successfully signed in to the Admin portal. All platform controls are now accessible."));
    }

    // ── HTML TEMPLATES ────────────────────────────────────────────

    private String registrationTemplate(String name, String role, String intro, String accent, String[] features) {
        StringBuilder featureRows = new StringBuilder();
        for (String f : features) {
            featureRows.append("""
                <tr>
                  <td style="padding:8px 0;color:#94a3b8;font-size:14px;">
                    <span style="color:%s;margin-right:10px;">✔</span>%s
                  </td>
                </tr>
                """.formatted(accent, f));
        }

        return baseTemplate(accent, """
            <h1 style="margin:0 0 8px;font-size:26px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">
              Welcome aboard, %s! 🎉
            </h1>
            <p style="margin:0 0 24px;color:#94a3b8;font-size:15px;line-height:1.6;">
              Your <strong style="color:%s;">%s</strong> account on TalentFlowAI has been successfully created.
            </p>
            <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:20px 24px;margin-bottom:24px;">
              <p style="margin:0 0 16px;color:#e2e8f0;font-size:14px;line-height:1.6;">%s</p>
              <table width="100%%" cellpadding="0" cellspacing="0">%s</table>
            </div>
            <p style="margin:0 0 24px;color:#94a3b8;font-size:13px;line-height:1.6;">
              🔐 <strong style="color:#e2e8f0;">Two-Factor Authentication is enabled</strong> on your account.
              Open your authenticator app to get your 6-digit code each time you log in.
            </p>
            <p style="margin:0;color:#475569;font-size:12px;">
              If you did not create this account, please contact us immediately at
              <a href="mailto:support@talentflowai.lk" style="color:%s;">support@talentflowai.lk</a>
            </p>
            """.formatted(name, accent, role, intro, featureRows, accent));
    }

    private String loginTemplate(String name, String role, String accent, String message) {
        String time = java.time.format.DateTimeFormatter
                .ofPattern("dd MMM yyyy, HH:mm 'UTC'")
                .format(java.time.ZonedDateTime.now(java.time.ZoneOffset.UTC));

        return baseTemplate(accent, """
            <h1 style="margin:0 0 8px;font-size:26px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">
              Login Successful ✅
            </h1>
            <p style="margin:0 0 24px;color:#94a3b8;font-size:15px;line-height:1.6;">
              Hi <strong style="color:#ffffff;">%s</strong>, welcome back!
            </p>
            <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:20px 24px;margin-bottom:24px;">
              <table width="100%%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:6px 0;color:#94a3b8;font-size:13px;width:120px;">Role</td>
                  <td style="padding:6px 0;color:#e2e8f0;font-size:13px;font-weight:600;">%s</td>
                </tr>
                <tr>
                  <td style="padding:6px 0;color:#94a3b8;font-size:13px;">Time</td>
                  <td style="padding:6px 0;color:#e2e8f0;font-size:13px;">%s</td>
                </tr>
                <tr>
                  <td style="padding:6px 0;color:#94a3b8;font-size:13px;">Auth Method</td>
                  <td style="padding:6px 0;color:#e2e8f0;font-size:13px;">Password + TOTP 2FA ✔</td>
                </tr>
              </table>
            </div>
            <p style="margin:0 0 24px;color:#94a3b8;font-size:14px;line-height:1.6;">%s</p>
            <p style="margin:0;color:#475569;font-size:12px;">
              Not you? Secure your account immediately at
              <a href="mailto:support@talentflowai.lk" style="color:%s;">support@talentflowai.lk</a>
            </p>
            """.formatted(name, role, time, message, accent));
    }

    private String baseTemplate(String accent, String body) {
        return """
            <!DOCTYPE html>
            <html lang="en">
            <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
            <body style="margin:0;padding:0;background:#020818;font-family:'Segoe UI',Arial,sans-serif;">
              <table width="100%%" cellpadding="0" cellspacing="0" style="background:#020818;padding:40px 20px;">
                <tr><td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%%;">

                    <!-- Header -->
                    <tr>
                      <td style="background:linear-gradient(135deg,#0a0f2e,#0f3460);border-radius:16px 16px 0 0;padding:32px 40px;text-align:center;border-bottom:2px solid %s;">
                        <h2 style="margin:0;font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">
                          TalentFlow<span style="color:%s;">AI</span>
                        </h2>
                        <p style="margin:6px 0 0;color:#94a3b8;font-size:12px;letter-spacing:1px;text-transform:uppercase;">
                          AI-Powered Talent Platform
                        </p>
                      </td>
                    </tr>

                    <!-- Body -->
                    <tr>
                      <td style="background:#071028;padding:36px 40px;border-left:1px solid #112244;border-right:1px solid #112244;">
                        %s
                      </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                      <td style="background:#040c1e;border-radius:0 0 16px 16px;padding:24px 40px;text-align:center;border:1px solid #112244;border-top:none;">
                        <p style="margin:0 0 8px;color:#475569;font-size:12px;">
                          © 2026 TalentFlowAI (Pvt) Ltd. · Colombo, Sri Lanka
                        </p>
                        <p style="margin:0;color:#475569;font-size:11px;">
                          <a href="mailto:support@talentflowai.lk" style="color:#4361ee;text-decoration:none;">support@talentflowai.lk</a>
                          &nbsp;·&nbsp;
                          <a href="#" style="color:#475569;text-decoration:none;">Unsubscribe</a>
                        </p>
                      </td>
                    </tr>

                  </table>
                </td></tr>
              </table>
            </body>
            </html>
            """.formatted(accent, accent, body);
    }
}
