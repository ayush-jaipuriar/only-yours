package com.onlyyours.service;

import com.onlyyours.dto.CustomQuestionDeckSummaryDto;
import com.onlyyours.dto.CustomQuestionDto;
import com.onlyyours.dto.CustomQuestionRequestDto;
import com.onlyyours.model.Couple;
import com.onlyyours.model.Question;
import com.onlyyours.model.User;
import com.onlyyours.repository.CoupleRepository;
import com.onlyyours.repository.QuestionRepository;
import com.onlyyours.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
class CustomQuestionServiceTest {

    @Autowired private CustomQuestionService customQuestionService;
    @Autowired private UserRepository userRepository;
    @Autowired private CoupleRepository coupleRepository;
    @Autowired private QuestionRepository questionRepository;

    private User userA;
    private User userB;
    private Couple couple;

    @BeforeEach
    void setUp() {
        userA = new User();
        userA.setEmail("custom-a@test.com");
        userA.setName("Custom A");
        userA.setGoogleUserId("google-custom-a");
        userA = userRepository.save(userA);

        userB = new User();
        userB.setEmail("custom-b@test.com");
        userB.setName("Custom B");
        userB.setGoogleUserId("google-custom-b");
        userB = userRepository.save(userB);

        couple = new Couple();
        couple.setUser1(userA);
        couple.setUser2(userB);
        couple = coupleRepository.save(couple);
    }

    @Test
    void createQuestion_SavesCustomCoupleQuestion() {
        CustomQuestionDto created = customQuestionService.createQuestion(userA.getId(), request("What is your comfort movie?"));

        Question saved = questionRepository.findById(created.getId()).orElseThrow();
        assertEquals(Question.SourceType.CUSTOM_COUPLE, saved.getSourceType());
        assertEquals(couple.getId(), saved.getCouple().getId());
        assertEquals(userA.getId(), saved.getCreatedBy().getId());
        assertFalse(saved.isArchived());
    }

    @Test
    void createQuestion_BlocksNormalizedDuplicateAcrossCouple() {
        customQuestionService.createQuestion(userA.getId(), request("  Favorite  rainy   day plan?  "));

        IllegalStateException exception = assertThrows(
                IllegalStateException.class,
                () -> customQuestionService.createQuestion(userB.getId(), request("favorite rainy day plan?"))
        );

        assertTrue(exception.getMessage().contains("already exists"));
    }

    @Test
    void getMyQuestions_ReturnsOnlyAuthorsOwnQuestions() {
        customQuestionService.createQuestion(userA.getId(), request("Question from A?"));
        customQuestionService.createQuestion(userB.getId(), request("Question from B?"));

        List<CustomQuestionDto> authoredByA = customQuestionService.getMyQuestions(userA.getId());
        List<CustomQuestionDto> authoredByB = customQuestionService.getMyQuestions(userB.getId());

        assertEquals(1, authoredByA.size());
        assertEquals("Question from A?", authoredByA.get(0).getQuestionText());
        assertEquals(1, authoredByB.size());
        assertEquals("Question from B?", authoredByB.get(0).getQuestionText());
    }

    @Test
    void updateQuestion_OnlyChangesCreatorsQuestion() {
        CustomQuestionDto created = customQuestionService.createQuestion(userA.getId(), request("Old prompt?"));

        CustomQuestionDto updated = customQuestionService.updateQuestion(userA.getId(), created.getId(), request("New prompt?"));

        assertEquals("New prompt?", updated.getQuestionText());
        assertThrows(
                IllegalStateException.class,
                () -> customQuestionService.updateQuestion(userB.getId(), created.getId(), request("Nope"))
        );
    }

    @Test
    void deleteQuestion_ArchivesInsteadOfRemovingRow() {
        CustomQuestionDto created = customQuestionService.createQuestion(userA.getId(), request("Delete me?"));

        customQuestionService.deleteQuestion(userA.getId(), created.getId());

        Question archived = questionRepository.findById(created.getId()).orElseThrow();
        assertTrue(archived.isArchived());
        assertTrue(customQuestionService.getMyQuestions(userA.getId()).isEmpty());
    }

    @Test
    void getDeckSummary_UsesCombinedCoupleCountForPlayability() {
        for (int i = 0; i < 4; i++) {
            customQuestionService.createQuestion(userA.getId(), request("A Question " + i));
            customQuestionService.createQuestion(userB.getId(), request("B Question " + i));
        }

        CustomQuestionDeckSummaryDto summary = customQuestionService.getDeckSummary(userA.getId());

        assertEquals(4, summary.getAuthoredQuestionCount());
        assertEquals(8, summary.getCouplePlayableQuestionCount());
        assertEquals(0, summary.getQuestionsNeededToPlay());
        assertTrue(summary.getPlayable());
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
}
