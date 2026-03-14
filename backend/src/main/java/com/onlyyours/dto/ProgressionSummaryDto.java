package com.onlyyours.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProgressionSummaryDto {
    private ProgressionSnapshotDto individualProgression;
    private ProgressionSnapshotDto coupleProgression;
    private List<BadgeDto> achievements;
    private List<ProgressionMilestoneDto> recentMilestones;
}
