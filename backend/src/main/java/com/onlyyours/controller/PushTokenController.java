package com.onlyyours.controller;

import com.onlyyours.dto.MessageResponseDto;
import com.onlyyours.dto.PushTokenRequestDto;
import com.onlyyours.service.PushNotificationService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import com.onlyyours.repository.UserRepository;

import java.util.UUID;

@RestController
@RequestMapping("/api/push")
public class PushTokenController {

    private final PushNotificationService pushNotificationService;
    private final UserRepository userRepository;

    public PushTokenController(PushNotificationService pushNotificationService,
                               UserRepository userRepository) {
        this.pushNotificationService = pushNotificationService;
        this.userRepository = userRepository;
    }

    @PostMapping("/register")
    public ResponseEntity<MessageResponseDto> registerToken(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody PushTokenRequestDto request) {
        UUID userId = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("User not found"))
                .getId();
        pushNotificationService.registerToken(userId, request.getToken(), request.getDeviceId());
        return ResponseEntity.ok(new MessageResponseDto("Push token registered"));
    }

    @DeleteMapping("/unregister")
    public ResponseEntity<MessageResponseDto> unregisterToken(
            @RequestBody PushTokenRequestDto request) {
        pushNotificationService.unregisterToken(request.getToken());
        return ResponseEntity.ok(new MessageResponseDto("Push token removed"));
    }
}
