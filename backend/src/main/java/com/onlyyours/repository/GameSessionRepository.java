package com.onlyyours.repository;

import com.onlyyours.model.GameSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository for GameSession entity.
 * 
 * Provides custom query methods for game flow management.
 */
@Repository
public interface GameSessionRepository extends JpaRepository<GameSession, UUID> {
    
    /**
     * Find a game session by ID and specific status.
     * Useful for validating that a session is in the expected state.
     * 
     * @param id Session ID
     * @param status Expected status (e.g., "INVITED", "ROUND1")
     * @return Optional containing the session if found with that status
     */
    Optional<GameSession> findByIdAndStatus(UUID id, GameSession.GameStatus status);
    
    /**
     * Find all game sessions for a couple with a specific status.
     * Example: Find all INVITED sessions to check for pending invitations.
     * 
     * @param coupleId Couple's ID
     * @param status Session status to filter by
     * @return List of matching sessions
     */
    List<GameSession> findByCouple_IdAndStatus(UUID coupleId, GameSession.GameStatus status);
    
    /**
     * Find the most recent game session for a couple.
     * Useful for displaying last played game or resuming.
     * 
     * @param coupleId Couple's ID
     * @return Optional containing the most recent session
     */
    Optional<GameSession> findFirstByCouple_IdOrderByCreatedAtDesc(UUID coupleId);
} 