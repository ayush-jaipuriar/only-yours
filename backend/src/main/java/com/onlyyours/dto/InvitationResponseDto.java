package com.onlyyours.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;

/**
 * DTO for invitation response (accept/decline) from client via WebSocket.
 * 
 * Received on:
 * - /app/game.accept (accepted = true implied by endpoint)
 * - /app/game.decline (accepted = false implied by endpoint)
 * 
 * Note: In current implementation, accept/decline are separate endpoints,
 * so this DTO primarily carries the sessionId. The accepted field could be
 * used if a unified response endpoint is implemented in the future.
 * 
 * @see com.onlyyours.controller.GameController#handleAcceptance
 * @see com.onlyyours.controller.GameController#handleDecline
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class InvitationResponseDto {
    /**
     * Game session ID being responded to
     */
    @NotNull(message = "Session ID is required")
    private UUID sessionId;
    
    /**
     * Whether invitation was accepted (true) or declined (false)
     * Optional field for future unified endpoint
     */
    private Boolean accepted;
}
