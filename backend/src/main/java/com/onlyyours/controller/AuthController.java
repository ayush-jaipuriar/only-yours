package com.onlyyours.controller;

import com.onlyyours.dto.AuthResponseDto;
import com.onlyyours.dto.ForgotPasswordRequestDto;
import com.onlyyours.dto.GoogleSignInRequestDto;
import com.onlyyours.dto.LoginRequestDto;
import com.onlyyours.dto.MessageResponseDto;
import com.onlyyours.dto.RefreshTokenRequestDto;
import com.onlyyours.dto.RegisterRequestDto;
import com.onlyyours.dto.ResetPasswordRequestDto;
import com.onlyyours.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/google/signin")
    public ResponseEntity<MessageResponseDto> googleSignIn(@RequestBody GoogleSignInRequestDto request) {
        try {
            authService.authenticateGoogleUser(request.getIdToken());
            return ResponseEntity.status(HttpStatus.GONE)
                    .body(new MessageResponseDto("Google sign-in is temporarily disabled"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.GONE)
                    .body(new MessageResponseDto(e.getMessage()));
        }
    }

    @PostMapping("/register")
    public ResponseEntity<Object> register(@Valid @RequestBody RegisterRequestDto request) {
        try {
            AuthResponseDto response = authService.registerEmailUser(request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new MessageResponseDto("Registration failed. Please try again."));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<Object> login(@Valid @RequestBody LoginRequestDto request) {
        try {
            AuthResponseDto response = authService.loginEmailUser(request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new MessageResponseDto("Invalid credentials"));
        }
    }

    @PostMapping("/refresh")
    public ResponseEntity<Object> refresh(@Valid @RequestBody RefreshTokenRequestDto request) {
        try {
            AuthResponseDto response = authService.refreshAccessToken(request.getRefreshToken());
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new MessageResponseDto("Invalid refresh token"));
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<MessageResponseDto> logout(@Valid @RequestBody RefreshTokenRequestDto request) {
        authService.revokeRefreshToken(request.getRefreshToken());
        return ResponseEntity.ok(new MessageResponseDto("Logged out successfully"));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<MessageResponseDto> forgotPassword(@Valid @RequestBody ForgotPasswordRequestDto request) {
        String message = authService.requestPasswordReset(request.getEmail());
        return ResponseEntity.ok(new MessageResponseDto(message));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<MessageResponseDto> resetPassword(@Valid @RequestBody ResetPasswordRequestDto request) {
        try {
            String message = authService.resetPassword(request.getToken(), request.getNewPassword());
            return ResponseEntity.ok(new MessageResponseDto(message));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new MessageResponseDto("Invalid or expired reset token"));
        }
    }
} 