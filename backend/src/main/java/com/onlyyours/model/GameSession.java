package com.onlyyours.model;

import jakarta.persistence.*;
import lombok.Data;

import java.util.Date;
import java.util.UUID;

/**
 * Entity representing a game session between a couple.
 * 
 * Tracks the lifecycle from invitation through Round 1 (answering) and 
 * Round 2 (guessing) to completion, storing the selected questions and 
 * current progress.
 */
@Entity
@Table(name = "game_sessions")
@Data
public class GameSession {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "couple_id", nullable = false)
    private Couple couple;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private GameStatus status;

    @Column(name = "player1_score")
    private Integer player1Score;

    @Column(name = "player2_score")
    private Integer player2Score;

    // Sprint 4 additions for game flow tracking
    
    /**
     * ID of the question category selected for this game
     */
    @Column(name = "category_id")
    private Integer categoryId;
    
    /**
     * Comma-separated list of question IDs for this game session.
     * Example: "12,45,67,89,102,145,178,201"
     * Questions are randomly selected when game is accepted.
     */
    @Column(name = "question_ids", length = 500)
    private String questionIds;
    
    /**
     * Zero-based index of the current question.
     * 0 = first question, 7 = last question (for 8-question game)
     */
    @Column(name = "current_question_index")
    private Integer currentQuestionIndex;
    
    /**
     * Timestamp when the game session was created (invitation sent)
     */
    @Column(name = "created_at")
    @Temporal(TemporalType.TIMESTAMP)
    private Date createdAt;
    
    /**
     * Timestamp when the game was started (invitation accepted, ROUND1 begins)
     */
    @Column(name = "started_at")
    @Temporal(TemporalType.TIMESTAMP)
    private Date startedAt;
    
    /**
     * Timestamp when the game was completed (ROUND2 finished)
     */
    @Column(name = "completed_at")
    @Temporal(TemporalType.TIMESTAMP)
    private Date completedAt;

    /**
     * Game session lifecycle states
     */
    public enum GameStatus {
        /** Invitation sent, waiting for partner to accept/decline */
        INVITED,
        /** Partner declined the invitation */
        DECLINED,
        /** Round 1: Both players answering questions about themselves */
        ROUND1,
        /** Round 2: Both players guessing partner's answers */
        ROUND2,
        /** Game finished, scores calculated */
        COMPLETED
    }
} 