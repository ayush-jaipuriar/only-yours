package com.onlyyours.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GameHistoryItemDto {
    private UUID sessionId;
    private Long completedAt;
    private Integer myScore;
    private Integer partnerScore;
    private String partnerName;
    private Integer categoryId;
    private String result;
}
