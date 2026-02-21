package com.onlyyours.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * DTO for question data broadcast to both players via WebSocket.
 * 
 * Sent on game topic (/topic/game/{sessionId}) when:
 * - Game starts (first question)
 * - Both players answer current question (next question)
 * 
 * @see com.onlyyours.service.GameService#buildQuestionPayload
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuestionPayloadDto {
    /**
     * Message type identifier ("QUESTION")
     */
    @Builder.Default
    private String type = "QUESTION";
    
    /**
     * Game session this question belongs to
     */
    private UUID sessionId;
    
    /**
     * Database ID of the question
     */
    private Integer questionId;
    
    /**
     * 1-based question number for display (e.g., 1, 2, 3...)
     */
    private Integer questionNumber;
    
    /**
     * Total number of questions in this game (typically 8)
     */
    private Integer totalQuestions;
    
    /**
     * The question text to display
     */
    private String questionText;
    
    /**
     * Answer option A
     */
    private String optionA;
    
    /**
     * Answer option B
     */
    private String optionB;
    
    /**
     * Answer option C
     */
    private String optionC;
    
    /**
     * Answer option D
     */
    private String optionD;
    
    /**
     * Current round: "ROUND1" (answering) or "ROUND2" (guessing)
     */
    private String round;
}
