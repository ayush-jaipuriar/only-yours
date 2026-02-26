package com.onlyyours.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardStatsDto {
    private Integer gamesPlayed;
    private Double averageScore;
    private Integer bestScore;
    private Integer streakDays;
    private Double invitationAcceptanceRate;
    private Double avgInvitationResponseSeconds;
}
