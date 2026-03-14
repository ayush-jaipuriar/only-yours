package com.onlyyours.model;

import jakarta.persistence.*;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "progression_events", uniqueConstraints = {
        @UniqueConstraint(
                name = "uk_progression_events_scope_event",
                columnNames = {"scope_type", "scope_ref_id", "event_key"}
        )
})
@Data
public class ProgressionEvent {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Enumerated(EnumType.STRING)
    @Column(name = "scope_type", nullable = false, length = 16)
    private ScopeType scopeType;

    @Column(name = "scope_ref_id", nullable = false)
    private UUID scopeRefId;

    @Enumerated(EnumType.STRING)
    @Column(name = "event_type", nullable = false, length = 48)
    private EventType eventType;

    @Column(name = "event_key", nullable = false, length = 160)
    private String eventKey;

    @Column(name = "reference_code", length = 80)
    private String referenceCode;

    @Column(name = "xp_delta", nullable = false)
    private Long xpDelta = 0L;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }

    public enum ScopeType {
        USER,
        COUPLE
    }

    public enum EventType {
        DAILY_LOGIN,
        PROFILE_COMPLETION,
        LEVEL_UP,
        INVITATION_ACCEPTED,
        INVITATION_DECLINED,
        GAME_COMPLETED,
        GAME_WIN,
        CORRECT_GUESSES,
        ANSWER_ALL,
        CONSISTENCY_BONUS,
        ACHIEVEMENT_UNLOCKED
    }
}
