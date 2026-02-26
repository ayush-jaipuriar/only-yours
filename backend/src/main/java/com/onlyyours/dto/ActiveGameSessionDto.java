package com.onlyyours.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ActiveGameSessionDto {
    private UUID sessionId;
    private String status;
    private String round;
    private Integer categoryId;
    private Integer currentQuestionNumber;
    private Integer totalQuestions;
    private String partnerName;
    private Long createdAt;
    private Long startedAt;
    private Long completedAt;
    private Long expiresAt;
    private Long lastActivityAt;
    private Boolean canContinue;
}
