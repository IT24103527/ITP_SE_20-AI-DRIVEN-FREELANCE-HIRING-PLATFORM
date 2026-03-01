package com.example.talentflowbackend.entity;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

@Entity
@Table(name = "users")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private String password;

    private String fullName;
    private String phoneNumber;

    @Enumerated(EnumType.STRING)
    private Role role; // This correctly references Role.java now

    // Freelancer Specific Fields
    private String professionalTitle;
    private String skills;
    private String portfolioUrl;

    @Column(length = 1000)
    private String bio;

    // Client Specific Fields
    private String companyName;

    // Admin Specific Fields
    private String adminCode;

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        // Ensure role is not null to avoid NullPointerException
        return List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }
}