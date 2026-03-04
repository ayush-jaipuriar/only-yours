package com.onlyyours.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UnlinkPreviewDto {
    private boolean requiresConfirmation;
    private String confirmationToken;
    private Long cooldownDurationHours;
    private String message;
    private UserDto partner;
}
