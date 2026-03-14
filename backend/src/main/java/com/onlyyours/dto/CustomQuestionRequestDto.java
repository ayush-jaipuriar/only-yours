package com.onlyyours.dto;

import lombok.Data;

@Data
public class CustomQuestionRequestDto {
    private String questionText;
    private String optionA;
    private String optionB;
    private String optionC;
    private String optionD;
}
