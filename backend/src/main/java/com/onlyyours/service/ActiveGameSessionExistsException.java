package com.onlyyours.service;

import java.util.UUID;

public class ActiveGameSessionExistsException extends IllegalStateException {
    private final UUID sessionId;

    public ActiveGameSessionExistsException(UUID sessionId) {
        super("Active game session already exists for this couple");
        this.sessionId = sessionId;
    }

    public UUID getSessionId() {
        return sessionId;
    }
}
