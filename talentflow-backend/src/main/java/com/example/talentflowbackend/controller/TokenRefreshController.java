package com.example.talentflowbackend.controller;

import com.example.talentflowbackend.dto.AuthResponse;
import com.example.talentflowbackend.dto.TokenRefreshRequest;
import com.example.talentflowbackend.service.TokenRefreshService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class TokenRefreshController {

    private final TokenRefreshService tokenRefreshService;

    /**
     * POST /api/auth/refresh
     * Accepts a valid refresh token and returns a new access token + rotated refresh token.
     * This endpoint is public (no JWT required) — listed in SecurityConfig permitAll.
     */
    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(@Valid @RequestBody TokenRefreshRequest request) {
        AuthResponse response = tokenRefreshService.refreshAccessToken(request.getRefreshToken());
        return ResponseEntity.ok(response);
    }

    /**
     * POST /api/auth/logout
     * Revokes the provided refresh token. Requires a valid JWT (authenticated endpoint).
     */
    @PostMapping("/logout")
    public ResponseEntity<AuthResponse> logout(@Valid @RequestBody TokenRefreshRequest request) {
        tokenRefreshService.revokeRefreshToken(request.getRefreshToken());
        return ResponseEntity.ok(AuthResponse.builder().message("Logged out successfully.").build());
    }
}
