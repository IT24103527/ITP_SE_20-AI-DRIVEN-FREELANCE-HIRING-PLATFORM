package com.example.talentflowbackend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.*;
import java.util.stream.Collectors;

@Document(collection = "users")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties({"accountNonExpired","accountNonLocked","credentialsNonExpired","enabled","authorities","username","password"})
public class User implements UserDetails {

    @Id
    private String id;

    @Indexed(unique = true)
    private String email;

    private String fullName;
    private String phoneNumber;

    // ── Per-role passwords (each role has its own independent password) ──
    @JsonIgnore private String clientPassword;
    @JsonIgnore private String freelancerPassword;
    @JsonIgnore private String adminPassword;

    // ── Roles this user is enrolled in ──
    @Builder.Default
    private Set<Role> roles = new HashSet<>();

    // Common fields
    @Field("createdAt") private Date createdAt;
    @Field("updatedAt") private Date updatedAt;
    @Field("isActive")  @Builder.Default private Boolean isActive = true;

    // Freelancer fields
    private String professionalTitle;
    private String skills;
    private String portfolioUrl;
    private String bio;
    private Double hourlyRate;
    private String experience;

    // Client fields
    private String companyName;
    private String industry;
    private String companySize;

    // Admin fields
    private String adminCode;
    private String department;

    // TOTP — one secret shared across all roles (scan once, use everywhere)
    @JsonIgnore private String totpSecret;

    // ── Brute-force protection ────────────────────────────────────
    @Builder.Default private int failedLoginAttempts = 0;
    @Builder.Default private int failedOtpAttempts   = 0;
    private Date lockedUntil;   // null = not locked

    // ── Helpers ──────────────────────────────────────────────────

    public boolean hasRole(Role role) {
        return roles != null && roles.contains(role);
    }

    public void addRole(Role role) {
        if (this.roles == null) this.roles = new HashSet<>();
        this.roles.add(role);
    }

    /** Returns true if the account is currently locked. */
    public boolean isLocked() {
        return lockedUntil != null && lockedUntil.after(new Date());
    }

    /** Returns remaining lock seconds, or 0 if not locked. */
    public long lockSecondsRemaining() {
        if (!isLocked()) return 0;
        return Math.max(0, (lockedUntil.getTime() - System.currentTimeMillis()) / 1000);
    }

    /** Returns the password for a specific role, or null if not set. */
    @JsonIgnore
    public String getPasswordForRole(Role role) {
        return switch (role) {
            case CLIENT     -> clientPassword;
            case FREELANCER -> freelancerPassword;
            case ADMIN      -> adminPassword;
        };
    }

    /** Sets the password for a specific role. */
    public void setPasswordForRole(Role role, String encodedPassword) {
        switch (role) {
            case CLIENT     -> this.clientPassword     = encodedPassword;
            case FREELANCER -> this.freelancerPassword = encodedPassword;
            case ADMIN      -> this.adminPassword      = encodedPassword;
        }
    }

    // ── UserDetails — Spring Security uses this for the auth manager ──
    // We return clientPassword as the "primary" password for Spring's
    // DaoAuthenticationProvider. Per-role validation is done manually in AuthService.
    @Override
    @JsonIgnore
    public String getPassword() {
        // Return whichever password is set (priority: CLIENT > FREELANCER > ADMIN)
        if (clientPassword     != null) return clientPassword;
        if (freelancerPassword != null) return freelancerPassword;
        if (adminPassword      != null) return adminPassword;
        return null;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        if (roles == null) return List.of();
        return roles.stream()
                .map(r -> new SimpleGrantedAuthority("ROLE_" + r.name()))
                .collect(Collectors.toList());
    }

    @Override public String getUsername()                { return email; }
    @Override public boolean isAccountNonExpired()       { return true; }
    @Override public boolean isAccountNonLocked()        { return true; }
    @Override public boolean isCredentialsNonExpired()   { return true; }
    @Override public boolean isEnabled()                 { return isActive != null ? isActive : true; }

    @Override
    public String toString() {
        return "User{id='" + id + "', email='" + email + "', roles=" + roles + '}';
    }
}
