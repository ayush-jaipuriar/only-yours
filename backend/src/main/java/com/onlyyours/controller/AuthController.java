package com.onlyyours.controller;

import com.onlyyours.dto.AuthResponseDto;
import com.onlyyours.dto.GoogleSignInRequestDto;
import com.onlyyours.service.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.security.GeneralSecurityException;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/google/signin")
    public ResponseEntity<?> googleSignIn(@RequestBody GoogleSignInRequestDto request) {
        try {
            String token = authService.authenticateGoogleUser(request.getIdToken());
            return ResponseEntity.ok(new AuthResponseDto(token));
        } catch (GeneralSecurityException | IOException | IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
} 