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
public class GuessResultDto {

    @Builder.Default
    private String type = "GUESS_RESULT";

    private UUID sessionId;

    private Integer questionId;

    private Integer questionNumber;

    private String questionText;

    private String yourGuess;

    private String partnerAnswer;

    private boolean correct;

    private Integer correctCount;
}
