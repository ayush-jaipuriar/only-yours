package com.onlyyours.model;

import jakarta.persistence.*;
import lombok.Data;

import java.util.UUID;

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

    private Integer player1Score;

    private Integer player2Score;

    public enum GameStatus {
        INVITED,
        ROUND1,
        ROUND2,
        COMPLETED
    }
} 