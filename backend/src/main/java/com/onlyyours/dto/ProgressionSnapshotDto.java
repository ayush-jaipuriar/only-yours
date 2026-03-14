package com.onlyyours.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProgressionSnapshotDto {
    private String scope;
    private String label;
    private Long xp;
    private Integer level;
    private Long xpIntoCurrentLevel;
    private Long xpNeededForNextLevel;
    private Long xpToNextLevel;
    private Integer progressPercent;
    private Integer currentStreakDays;
    private Integer longestStreakDays;
    private Integer achievementsUnlocked;
}
