package com.onlyyours.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GameReviewItemDto {
    private Integer questionId;
    private Integer questionNumber;
    private String questionText;
    private String submittedValue;
}
