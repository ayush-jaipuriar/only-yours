package com.onlyyours.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * DTO for game invitation messages sent via WebSocket.
 * 
 * Sent to partner's private queue (/user/queue/game-events) when a game is initiated.
 * Contains all information needed for the invitee to decide whether to accept.
 * 
 * @see com.onlyyours.controller.GameController#handleInvitation
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GameInvitationDto {
    /**
     * Message type identifier for client-side routing
     */
    @Builder.Default
    private String type = "INVITATION";
    
    /**
     * Unique identifier for the game session
     */
    private UUID sessionId;
    
    /**
     * Category ID selected for this game
     */
    private Integer categoryId;
    
    /**
     * Human-readable category name (e.g., "Getting to Know You")
     */
    private String categoryName;
    
    /**
     * Category description for context
     */
    private String categoryDescription;
    
    /**
     * Whether this category contains sensitive/mature content
     */
    private Boolean isSensitive;
    
    /**
     * User ID of the person who initiated the invitation
     */
    private UUID inviterId;
    
    /**
     * Display name of the inviter
     */
    private String inviterName;
    
    /**
     * Unix timestamp in milliseconds when invitation was created
     */
    private Long timestamp;
}
