package com.onlyyours.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GuessRequestDto {

    @NotNull(message = "Session ID is required")
    private UUID sessionId;

    @NotNull(message = "Question ID is required")
    private Integer questionId;

    @NotNull(message = "Guess is required")
    @Pattern(regexp = "^[A-D]$", message = "Guess must be A, B, C, or D")
    private String guess;
}
