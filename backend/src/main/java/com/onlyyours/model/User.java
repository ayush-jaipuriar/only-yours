package com.onlyyours.model;

import jakarta.persistence.*;
import lombok.Data;

import java.util.UUID;

@Entity
@Table(name = "users")
@Data
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(unique = true)
    private String googleUserId;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(unique = true, length = 100)
    private String username;

    @Column(length = 280)
    private String bio;

    @Column(name = "password_hash")
    private String passwordHash;

    @Column(name = "auth_provider", nullable = false)
    @Enumerated(EnumType.STRING)
    private AuthProvider authProvider = AuthProvider.GOOGLE;

    @Column(name = "timezone", nullable = false, length = 80)
    private String timezone = "UTC";

    @Column(name = "reminder_time_local", nullable = false, length = 5)
    private String reminderTimeLocal = "21:00";

    @Column(name = "quiet_hours_start", nullable = false, length = 5)
    private String quietHoursStart = "23:00";

    @Column(name = "quiet_hours_end", nullable = false, length = 5)
    private String quietHoursEnd = "07:00";

    public enum AuthProvider {
        EMAIL_PASSWORD,
        GOOGLE
    }
} 