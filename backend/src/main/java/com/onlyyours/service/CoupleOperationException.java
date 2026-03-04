package com.onlyyours.service;

import java.util.Collections;
import java.util.Map;
import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public class CoupleOperationException extends RuntimeException {
    private final String code;
    private final HttpStatus status;
    private final transient Map<String, Object> metadata;

    public CoupleOperationException(String code, HttpStatus status, String message) {
        this(code, status, message, Collections.emptyMap());
    }

    public CoupleOperationException(
            String code,
            HttpStatus status,
            String message,
            Map<String, Object> metadata
    ) {
        super(message);
        this.code = code;
        this.status = status;
        this.metadata = metadata == null ? Collections.emptyMap() : Map.copyOf(metadata);
    }
}
