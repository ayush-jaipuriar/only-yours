package com.onlyyours.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import java.util.UUID;

/**
 * DTO for answer submission from client via WebSocket.
 * 
 * Received on /app/game.answer endpoint when a player submits their answer.
 * Validated to ensure answer is one of A, B, C, or D.
 * 
 * @see com.onlyyours.controller.GameController#handleAnswer
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AnswerRequestDto {
    /**
     * Game session ID
     */
    @NotNull(message = "Session ID is required")
    private UUID sessionId;
    
    /**
     * Question being answered (database ID)
     */
    @NotNull(message = "Question ID is required")
    private Integer questionId;
    
    /**
     * Selected answer: must be "A", "B", "C", or "D"
     */
    @NotNull(message = "Answer is required")
    @Pattern(regexp = "^[A-D]$", message = "Answer must be A, B, C, or D")
    private String answer;
}
