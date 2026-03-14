package com.onlyyours.model;

import jakarta.persistence.*;
import lombok.Data;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "couple_progressions", uniqueConstraints = {
        @UniqueConstraint(name = "uk_couple_progressions_couple_id", columnNames = "couple_id")
})
@Data
public class CoupleProgression {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @OneToOne(optional = false)
    @JoinColumn(name = "couple_id", nullable = false, referencedColumnName = "id")
    private Couple couple;

    @Column(nullable = false)
    private Long xp = 0L;

    @Column(nullable = false)
    private Integer level = 1;

    @Column(name = "games_completed", nullable = false)
    private Integer gamesCompleted = 0;

    @Column(name = "total_combined_score", nullable = false)
    private Integer totalCombinedScore = 0;

    @Column(name = "best_combined_score", nullable = false)
    private Integer bestCombinedScore = 0;

    @Column(name = "responded_invitations", nullable = false)
    private Integer respondedInvitations = 0;

    @Column(name = "accepted_invitations", nullable = false)
    private Integer acceptedInvitations = 0;

    @Column(name = "current_streak_days", nullable = false)
    private Integer currentStreakDays = 0;

    @Column(name = "longest_streak_days", nullable = false)
    private Integer longestStreakDays = 0;

    @Column(name = "last_active_on")
    private LocalDate lastActiveOn;

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
