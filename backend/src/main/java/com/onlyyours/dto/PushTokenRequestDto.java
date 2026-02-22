package com.onlyyours.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class PushTokenRequestDto {

    @NotBlank(message = "Push token is required")
    private String token;

    private String deviceId;
}
