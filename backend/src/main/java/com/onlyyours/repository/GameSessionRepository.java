package com.onlyyours.repository;

import com.onlyyours.model.GameSession;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.Date;
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

    List<GameSession> findByCouple_IdAndStatusIn(UUID coupleId, Collection<GameSession.GameStatus> statuses);

    Optional<GameSession> findFirstByCouple_IdAndStatusInOrderByCreatedAtDesc(
            UUID coupleId,
            Collection<GameSession.GameStatus> statuses
    );

    @Query("""
            SELECT gs
            FROM GameSession gs
            WHERE (gs.couple.user1.id = :userId OR gs.couple.user2.id = :userId)
              AND gs.status IN :statuses
            ORDER BY gs.createdAt DESC
            """)
    List<GameSession> findByUserIdAndStatusInOrderByCreatedAtDesc(
            @Param("userId") UUID userId,
            @Param("statuses") Collection<GameSession.GameStatus> statuses
    );

    List<GameSession> findByStatusInAndExpiresAtBefore(
            Collection<GameSession.GameStatus> statuses,
            Date expiresBefore
    );

    @Query("""
            SELECT gs
            FROM GameSession gs
            WHERE (gs.couple.user1.id = :userId OR gs.couple.user2.id = :userId)
              AND gs.status = :status
            """)
    Page<GameSession> findByUserIdAndStatus(
            @Param("userId") UUID userId,
            @Param("status") GameSession.GameStatus status,
            Pageable pageable
    );

    @Query("""
            SELECT gs
            FROM GameSession gs
            WHERE (gs.couple.user1.id = :userId OR gs.couple.user2.id = :userId)
              AND gs.status = :status
            ORDER BY gs.completedAt DESC, gs.createdAt DESC
            """)
    List<GameSession> findAllByUserIdAndStatusOrderByCompletedAtDesc(
            @Param("userId") UUID userId,
            @Param("status") GameSession.GameStatus status
    );

    @Query("""
            SELECT gs
            FROM GameSession gs
            WHERE (gs.couple.user1.id = :userId OR gs.couple.user2.id = :userId)
            ORDER BY gs.createdAt DESC
            """)
    List<GameSession> findAllByUserIdOrderByCreatedAtDesc(@Param("userId") UUID userId);

    List<GameSession> findByCouple_IdOrderByCreatedAtDesc(UUID coupleId);
    
    /**
     * Find the most recent game session for a couple.
     * Useful for displaying last played game or resuming.
     * 
     * @param coupleId Couple's ID
     * @return Optional containing the most recent session
     */
    Optional<GameSession> findFirstByCouple_IdOrderByCreatedAtDesc(UUID coupleId);
} 