package com.onlyyours.service;

import java.util.UUID;

public class SessionExpiredException extends IllegalStateException {
    private final UUID sessionId;

    public SessionExpiredException(UUID sessionId) {
        super("Game session has expired");
        this.sessionId = sessionId;
    }

    public UUID getSessionId() {
        return sessionId;
    }
}
