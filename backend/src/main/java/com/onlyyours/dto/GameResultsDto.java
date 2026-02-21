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
public class GameResultsDto {

    @Builder.Default
    private String type = "GAME_RESULTS";

    private UUID sessionId;

    private String player1Name;

    private Integer player1Score;

    private String player2Name;

    private Integer player2Score;

    private Integer totalQuestions;

    private String message;
}
