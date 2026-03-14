package com.onlyyours.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CustomQuestionDeckSummaryDto {
    private Integer authoredQuestionCount;
    private Integer couplePlayableQuestionCount;
    private Integer minimumQuestionsRequired;
    private Integer questionsNeededToPlay;
    private Boolean playable;
    private Boolean linked;
    private String deckName;
    private String deckDescription;
}
