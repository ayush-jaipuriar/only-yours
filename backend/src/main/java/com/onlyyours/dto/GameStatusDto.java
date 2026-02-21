package com.onlyyours.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * DTO for game status updates sent via WebSocket.
 * 
 * Used for:
 * - Confirming answer receipt ("ANSWER_RECORDED")
 * - Indicating waiting state ("WAITING")
 * - Round completion ("ROUND1_COMPLETE")
 * - Error notifications
 * 
 * Sent to individual player queues (/user/queue/game-status) or
 * broadcast to game topic (/topic/game/{sessionId}) depending on context.
 * 
 * @see com.onlyyours.controller.GameController
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GameStatusDto {
    /**
     * Message type identifier ("STATUS")
     */
    @Builder.Default
    private String type = "STATUS";
    
    /**
     * Game session this status update relates to
     */
    private UUID sessionId;
    
    /**
     * Status code:
     * - "INVITATION_SENT": Invitation successfully sent to partner
     * - "INVITATION_DECLINED": Partner declined the invitation
     * - "ANSWER_RECORDED": Answer successfully saved
     * - "WAITING": Waiting for partner to answer
     * - "BOTH_ANSWERED": Both players have answered
     * - "ROUND1_COMPLETE": First round finished, transitioning to Round 2
     * - "ERROR": An error occurred
     */
    private String status;
    
    /**
     * User-friendly message to display
     */
    private String message;
}
