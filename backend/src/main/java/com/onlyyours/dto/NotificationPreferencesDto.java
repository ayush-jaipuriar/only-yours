package com.onlyyours.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationPreferencesDto {
    @NotBlank(message = "timezone is required")
    private String timezone;

    @NotBlank(message = "reminderTimeLocal is required")
    @Pattern(regexp = "^([01]\\d|2[0-3]):[0-5]\\d$", message = "reminderTimeLocal must be HH:mm")
    private String reminderTimeLocal;

    @NotBlank(message = "quietHoursStart is required")
    @Pattern(regexp = "^([01]\\d|2[0-3]):[0-5]\\d$", message = "quietHoursStart must be HH:mm")
    private String quietHoursStart;

    @NotBlank(message = "quietHoursEnd is required")
    @Pattern(regexp = "^([01]\\d|2[0-3]):[0-5]\\d$", message = "quietHoursEnd must be HH:mm")
    private String quietHoursEnd;
}
