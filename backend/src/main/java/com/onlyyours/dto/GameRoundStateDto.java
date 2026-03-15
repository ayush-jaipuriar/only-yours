package com.onlyyours.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GameRoundStateDto {

    @Builder.Default
    private String type = "ROUND_STATE";

    private UUID sessionId;
    private String round;
    private String status;
    private String message;
    private Integer totalQuestions;
    private Integer completedCount;
    private Integer correctCount;
    private List<GameReviewItemDto> reviewItems;
}
