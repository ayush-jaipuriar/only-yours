package com.onlyyours.model;

import jakarta.persistence.*;
import lombok.Data;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "user_progressions", uniqueConstraints = {
        @UniqueConstraint(name = "uk_user_progressions_user_id", columnNames = "user_id")
})
@Data
public class UserProgression {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @OneToOne(optional = false)
    @JoinColumn(name = "user_id", nullable = false, referencedColumnName = "id")
    private User user;

    @Column(nullable = false)
    private Long xp = 0L;

    @Column(nullable = false)
    private Integer level = 1;

    @Column(name = "games_completed", nullable = false)
    private Integer gamesCompleted = 0;

    @Column(name = "games_won", nullable = false)
    private Integer gamesWon = 0;

    @Column(name = "correct_guesses", nullable = false)
    private Integer correctGuesses = 0;

    @Column(name = "answer_all_games", nullable = false)
    private Integer answerAllGames = 0;

    @Column(name = "daily_login_days", nullable = false)
    private Integer dailyLoginDays = 0;

    @Column(name = "current_streak_days", nullable = false)
    private Integer currentStreakDays = 0;

    @Column(name = "longest_streak_days", nullable = false)
    private Integer longestStreakDays = 0;

    @Column(name = "best_score", nullable = false)
    private Integer bestScore = 0;

    @Column(name = "profile_completed", nullable = false)
    private Boolean profileCompleted = false;

    @Column(name = "last_active_on")
    private LocalDate lastActiveOn;

    @Column(name = "last_daily_login_on")
    private LocalDate lastDailyLoginOn;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }
}
