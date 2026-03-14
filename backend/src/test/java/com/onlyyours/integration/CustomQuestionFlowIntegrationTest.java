package com.onlyyours.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.onlyyours.dto.CustomQuestionRequestDto;
import com.onlyyours.model.Couple;
import com.onlyyours.model.Question;
import com.onlyyours.model.User;
import com.onlyyours.repository.CoupleRepository;
import com.onlyyours.repository.QuestionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;

import java.util.Map;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class CustomQuestionFlowIntegrationTest extends BaseIntegrationTest {

    @Autowired private ObjectMapper objectMapper;
    @Autowired private CoupleRepository coupleRepository;
    @Autowired private QuestionRepository questionRepository;

    private User userA;
    private User userB;

    @BeforeEach
    void setUp() {
        userA = createTestUser("phaseh-a@example.com", "Phase H A", "google-phaseh-a");
        userB = createTestUser("phaseh-b@example.com", "Phase H B", "google-phaseh-b");

        Couple couple = new Couple();
        couple.setUser1(userA);
        couple.setUser2(userB);
        coupleRepository.save(couple);
    }

    @Test
    void createQuestion_ListMine_AndHidePartnersQuestions() throws Exception {
        CustomQuestionRequestDto request = request("What helps you reset after a hard day?");

        mockMvc.perform(post("/api/custom-questions")
                        .header("Authorization", bearerHeader(userA))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.questionText").value("What helps you reset after a hard day?"));

        mockMvc.perform(get("/api/custom-questions/mine")
                        .header("Authorization", bearerHeader(userA)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].questionText").value("What helps you reset after a hard day?"));

        mockMvc.perform(get("/api/custom-questions/mine")
                        .header("Authorization", bearerHeader(userB)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    void updateOrDelete_PartnerAuthoredQuestion_IsBlocked() throws Exception {
        Question question = saveCustomQuestion(userA, "Who do you call first with good news?");

        mockMvc.perform(put("/api/custom-questions/{id}", question.getId())
                        .header("Authorization", bearerHeader(userB))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request("Edited by partner?"))))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("CUSTOM_QUESTION_CONFLICT"));

        mockMvc.perform(delete("/api/custom-questions/{id}", question.getId())
                        .header("Authorization", bearerHeader(userB)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("CUSTOM_QUESTION_CONFLICT"));
    }

    @Test
    void summary_TracksCombinedDeckReadiness() throws Exception {
        for (int i = 0; i < 4; i++) {
            saveCustomQuestion(userA, "Shared summary A " + i);
            saveCustomQuestion(userB, "Shared summary B " + i);
        }

        mockMvc.perform(get("/api/custom-questions/summary")
                        .header("Authorization", bearerHeader(userA)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.authoredQuestionCount").value(4))
                .andExpect(jsonPath("$.couplePlayableQuestionCount").value(8))
                .andExpect(jsonPath("$.questionsNeededToPlay").value(0))
                .andExpect(jsonPath("$.playable").value(true))
                .andExpect(jsonPath("$.deckName").value("Custom Couple Questions"));
    }

    @Test
    void duplicateQuestion_IsRejectedAcrossCouple() throws Exception {
        saveCustomQuestion(userA, "The exact same prompt?");

        mockMvc.perform(post("/api/custom-questions")
                        .header("Authorization", bearerHeader(userB))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request("  the exact same prompt?  "))))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("CUSTOM_QUESTION_CONFLICT"))
                .andExpect(jsonPath("$.message", containsString("already exists")));
    }

    private CustomQuestionRequestDto request(String questionText) {
        CustomQuestionRequestDto request = new CustomQuestionRequestDto();
        request.setQuestionText(questionText);
        request.setOptionA("A");
        request.setOptionB("B");
        request.setOptionC("C");
        request.setOptionD("D");
        return request;
    }

    private Question saveCustomQuestion(User author, String questionText) {
        Couple couple = coupleRepository.findByUserIdAndStatusOrderByCreatedAtDesc(author.getId(), Couple.RelationshipStatus.ACTIVE)
                .stream()
                .findFirst()
                .orElseThrow();
        Question question = new Question();
        question.setSourceType(Question.SourceType.CUSTOM_COUPLE);
        question.setCouple(couple);
        question.setCreatedBy(author);
        question.setText(questionText);
        question.setOptionA("A");
        question.setOptionB("B");
        question.setOptionC("C");
        question.setOptionD("D");
        return questionRepository.save(question);
    }
}
