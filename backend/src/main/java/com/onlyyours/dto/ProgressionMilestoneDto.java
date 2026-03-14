package com.onlyyours.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProgressionMilestoneDto {
    private String type;
    private String scope;
    private String ownerLabel;
    private String code;
    private String title;
    private String description;
    private Long earnedAt;
    private Long xpDelta;
    private Integer newLevel;
}
