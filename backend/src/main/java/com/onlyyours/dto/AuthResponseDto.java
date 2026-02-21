package com.onlyyours.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class AuthResponseDto {

    private String accessToken;
    private String refreshToken;
    private int expiresInSeconds;
    private AuthUserDto user;

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    @Builder
    public static class AuthUserDto {
        private UUID id;
        private String username;
        private String email;
    }
} 