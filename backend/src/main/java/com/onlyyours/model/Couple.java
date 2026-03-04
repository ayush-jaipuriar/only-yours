package com.onlyyours.model;

import jakarta.persistence.*;
import lombok.Data;

import java.util.Date;
import java.util.UUID;

@Entity
@Table(name = "couples")
@Data
public class Couple {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @OneToOne
    @JoinColumn(name = "user1_id", referencedColumnName = "id")
    private User user1;

    @OneToOne
    @JoinColumn(name = "user2_id", referencedColumnName = "id")
    private User user2;

    @Column(unique = true)
    private String linkCode;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RelationshipStatus status = RelationshipStatus.ACTIVE;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Temporal(TemporalType.TIMESTAMP)
    private Date createdAt;

    @Column(name = "linked_at")
    @Temporal(TemporalType.TIMESTAMP)
    private Date linkedAt;

    @Column(name = "unlinked_at")
    @Temporal(TemporalType.TIMESTAMP)
    private Date unlinkedAt;

    @Column(name = "cooldown_ends_at")
    @Temporal(TemporalType.TIMESTAMP)
    private Date cooldownEndsAt;

    @ManyToOne
    @JoinColumn(name = "unlinked_by_user_id", referencedColumnName = "id")
    private User unlinkedByUser;

    @Column(name = "unlink_reason", length = 280)
    private String unlinkReason;

    @PrePersist
    protected void onCreate() {
        Date now = new Date();
        if (createdAt == null) {
            createdAt = now;
        }
        if (status == null) {
            status = RelationshipStatus.ACTIVE;
        }
        if (status == RelationshipStatus.ACTIVE && linkedAt == null && user2 != null) {
            linkedAt = now;
        }
    }

    public enum RelationshipStatus {
        PENDING,
        ACTIVE,
        UNLINKED
    }
} 