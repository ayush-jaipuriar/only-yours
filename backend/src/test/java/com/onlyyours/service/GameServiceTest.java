package com.onlyyours.service;

import com.onlyyours.dto.GameInvitationDto;
import com.onlyyours.dto.QuestionPayloadDto;
import com.onlyyours.model.*;
import com.onlyyours.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
class GameServiceTest {

    @Autowired private GameService gameService;
    @Autowired private GameSessionRepository sessionRepo;
    @Autowired private UserRepository userRepo;
    @Autowired private CoupleRepository coupleRepo;
    @Autowired private QuestionRepository questionRepo;
    @Autowired private QuestionCategoryRepository categoryRepo;
    @Autowired private GameAnswerRepository answerRepo;

    private User user1, user2;
    private Couple couple;
    private QuestionCategory category;
    private List<Question> questions;

    @BeforeEach
    void setUp() {
        user1 = new User();
        user1.setEmail("user1@test.com");
        user1.setName("User 1");
        user1.setGoogleUserId("google-user-1");
        user1 = userRepo.save(user1);

        user2 = new User();
        user2.setEmail("user2@test.com");
        user2.setName("User 2");
        user2.setGoogleUserId("google-user-2");
        user2 = userRepo.save(user2);

        couple = new Couple();
        couple.setUser1(user1);
        couple.setUser2(user2);
        couple = coupleRepo.save(couple);

        category = new QuestionCategory();
        category.setName("Test Category");
        category.setDescription("For testing");
        category.setSensitive(false);
        category = categoryRepo.save(category);

        questions = new ArrayList<>();
        for (int i = 1; i <= 10; i++) {
            Question q = new Question();
            q.setCategory(category);
            q.setText("Test question " + i + "?");
            q.setOptionA("Option A" + i);
            q.setOptionB("Option B" + i);
            q.setOptionC("Option C" + i);
            q.setOptionD("Option D" + i);
            questions.add(questionRepo.save(q));
        }
    }

    @Test
    void testCreateInvitation_Success() {
        GameInvitationDto invitation = gameService.createInvitation(user1.getId(), category.getId());

        assertNotNull(invitation.getSessionId());
        assertEquals(category.getId(), invitation.getCategoryId());
        assertEquals(category.getName(), invitation.getCategoryName());
        assertEquals(user1.getName(), invitation.getInviterName());
        assertNotNull(invitation.getTimestamp());

        GameSession session = sessionRepo.findById(invitation.getSessionId()).orElseThrow();
        assertEquals(GameSession.GameStatus.INVITED, session.getStatus());
        assertEquals(couple.getId(), session.getCouple().getId());
        assertEquals(category.getId(), session.getCategoryId());
        assertNotNull(session.getCreatedAt());
    }

    @Test
    void testCreateInvitation_UserNotInCouple() {
        User soloUser = new User();
        soloUser.setEmail("solo@test.com");
        soloUser.setName("Solo User");
        soloUser.setGoogleUserId("google-solo");
        final User savedSoloUser = userRepo.save(soloUser);

        assertThrows(IllegalStateException.class, () ->
            gameService.createInvitation(savedSoloUser.getId(), category.getId())
        );
    }

    @Test
    void testAcceptInvitation_Success() {
        GameInvitationDto invitation = gameService.createInvitation(user1.getId(), category.getId());

        QuestionPayloadDto firstQuestion = gameService.acceptInvitation(
                invitation.getSessionId(), user2.getId());

        assertNotNull(firstQuestion);
        assertEquals(invitation.getSessionId(), firstQuestion.getSessionId());
        assertEquals(1, firstQuestion.getQuestionNumber());
        assertEquals(8, firstQuestion.getTotalQuestions());
        assertEquals("ROUND1", firstQuestion.getRound());
        assertNotNull(firstQuestion.getQuestionText());

        GameSession session = sessionRepo.findById(invitation.getSessionId()).orElseThrow();
        assertEquals(GameSession.GameStatus.ROUND1, session.getStatus());
        assertNotNull(session.getQuestionIds());
        assertEquals(0, session.getCurrentQuestionIndex());
        assertNotNull(session.getStartedAt());
    }

    @Test
    void testAcceptInvitation_WrongStatus() {
        GameInvitationDto invitation = gameService.createInvitation(user1.getId(), category.getId());
        
        GameSession session = sessionRepo.findById(invitation.getSessionId()).orElseThrow();
        session.setStatus(GameSession.GameStatus.ROUND1);
        sessionRepo.save(session);

        assertThrows(IllegalStateException.class, () ->
            gameService.acceptInvitation(invitation.getSessionId(), user2.getId())
        );
    }

    @Test
    void testDeclineInvitation_Success() {
        GameInvitationDto invitation = gameService.createInvitation(user1.getId(), category.getId());

        gameService.declineInvitation(invitation.getSessionId(), user2.getId());

        GameSession session = sessionRepo.findById(invitation.getSessionId()).orElseThrow();
        assertEquals(GameSession.GameStatus.DECLINED, session.getStatus());
    }

    @Test
    void testSubmitAnswer_FirstPlayer() {
        GameInvitationDto invitation = gameService.createInvitation(user1.getId(), category.getId());
        QuestionPayloadDto firstQ = gameService.acceptInvitation(
                invitation.getSessionId(), user2.getId());

        Optional<QuestionPayloadDto> nextQuestion = gameService.submitAnswer(
                invitation.getSessionId(), user1.getId(), firstQ.getQuestionId(), "A");

        assertFalse(nextQuestion.isPresent(), "Should wait for partner");

        long count = answerRepo.countByGameSession_IdAndQuestion_Id(
                invitation.getSessionId(), firstQ.getQuestionId());
        assertEquals(1, count);
    }

    @Test
    void testSubmitAnswer_BothPlayers_AdvancesToNextQuestion() {
        GameInvitationDto invitation = gameService.createInvitation(user1.getId(), category.getId());
        QuestionPayloadDto firstQ = gameService.acceptInvitation(
                invitation.getSessionId(), user2.getId());

        Optional<QuestionPayloadDto> afterFirst = gameService.submitAnswer(
                invitation.getSessionId(), user1.getId(), firstQ.getQuestionId(), "A");
        Optional<QuestionPayloadDto> afterSecond = gameService.submitAnswer(
                invitation.getSessionId(), user2.getId(), firstQ.getQuestionId(), "B");

        assertFalse(afterFirst.isPresent(), "First answer should wait");
        assertTrue(afterSecond.isPresent(), "Second answer should return next question");
        
        QuestionPayloadDto nextQ = afterSecond.get();
        assertEquals(2, nextQ.getQuestionNumber());
        assertEquals(invitation.getSessionId(), nextQ.getSessionId());

        long count = answerRepo.countByGameSession_IdAndQuestion_Id(
                invitation.getSessionId(), firstQ.getQuestionId());
        assertEquals(2, count);
    }

    @Test
    void testSubmitAnswer_LastQuestion_TransitionsToRound2() {
        GameInvitationDto invitation = gameService.createInvitation(user1.getId(), category.getId());
        QuestionPayloadDto currentQ = gameService.acceptInvitation(
                invitation.getSessionId(), user2.getId());

        for (int i = 0; i < 7; i++) {
            gameService.submitAnswer(invitation.getSessionId(), user1.getId(), currentQ.getQuestionId(), "A");
            Optional<QuestionPayloadDto> next = gameService.submitAnswer(
                    invitation.getSessionId(), user2.getId(), currentQ.getQuestionId(), "B");
            if (next.isPresent()) {
                currentQ = next.get();
            }
        }

        assertEquals(8, currentQ.getQuestionNumber());

        gameService.submitAnswer(invitation.getSessionId(), user1.getId(), currentQ.getQuestionId(), "C");
        Optional<QuestionPayloadDto> finalResult = gameService.submitAnswer(
                invitation.getSessionId(), user2.getId(), currentQ.getQuestionId(), "D");

        assertFalse(finalResult.isPresent(), "Should be no next question after Round 1");
        
        GameSession session = sessionRepo.findById(invitation.getSessionId()).orElseThrow();
        assertEquals(GameSession.GameStatus.ROUND2, session.getStatus());
    }

    @Test
    void testSubmitAnswer_DuplicateSubmission_Idempotent() {
        GameInvitationDto invitation = gameService.createInvitation(user1.getId(), category.getId());
        QuestionPayloadDto firstQ = gameService.acceptInvitation(
                invitation.getSessionId(), user2.getId());

        gameService.submitAnswer(invitation.getSessionId(), user1.getId(), firstQ.getQuestionId(), "A");
        Optional<QuestionPayloadDto> duplicate = gameService.submitAnswer(
                invitation.getSessionId(), user1.getId(), firstQ.getQuestionId(), "A");

        assertFalse(duplicate.isPresent());
        
        long count = answerRepo.countByGameSession_IdAndQuestion_Id(
                invitation.getSessionId(), firstQ.getQuestionId());
        assertEquals(1, count, "Should only have one answer despite duplicate submission");
    }

    @Test
    void testSubmitAnswer_InvalidFormat() {
        GameInvitationDto invitation = gameService.createInvitation(user1.getId(), category.getId());
        QuestionPayloadDto firstQ = gameService.acceptInvitation(
                invitation.getSessionId(), user2.getId());

        assertThrows(IllegalArgumentException.class, () ->
            gameService.submitAnswer(invitation.getSessionId(), user1.getId(), firstQ.getQuestionId(), "X"));
        assertThrows(IllegalArgumentException.class, () ->
            gameService.submitAnswer(invitation.getSessionId(), user1.getId(), firstQ.getQuestionId(), "AB"));
        assertThrows(IllegalArgumentException.class, () ->
            gameService.submitAnswer(invitation.getSessionId(), user1.getId(), firstQ.getQuestionId(), "1"));
    }

    @Test
    void testSubmitAnswer_WrongGameStatus() {
        GameInvitationDto invitation = gameService.createInvitation(user1.getId(), category.getId());

        assertThrows(IllegalStateException.class, () ->
            gameService.submitAnswer(invitation.getSessionId(), user1.getId(), 1, "A"));
    }

    @Test
    void testAreBothPlayersAnswered() {
        GameInvitationDto invitation = gameService.createInvitation(user1.getId(), category.getId());
        QuestionPayloadDto firstQ = gameService.acceptInvitation(
                invitation.getSessionId(), user2.getId());

        assertFalse(gameService.areBothPlayersAnswered(invitation.getSessionId(), firstQ.getQuestionId()));

        gameService.submitAnswer(invitation.getSessionId(), user1.getId(), firstQ.getQuestionId(), "A");
        assertFalse(gameService.areBothPlayersAnswered(invitation.getSessionId(), firstQ.getQuestionId()));

        gameService.submitAnswer(invitation.getSessionId(), user2.getId(), firstQ.getQuestionId(), "B");
        assertTrue(gameService.areBothPlayersAnswered(invitation.getSessionId(), firstQ.getQuestionId()));
    }

    @Test
    void testGetGameSession() {
        GameInvitationDto invitation = gameService.createInvitation(user1.getId(), category.getId());

        GameSession session = gameService.getGameSession(invitation.getSessionId());

        assertNotNull(session);
        assertEquals(invitation.getSessionId(), session.getId());
        assertEquals(GameSession.GameStatus.INVITED, session.getStatus());
    }

    @Test
    void testGetGameSession_NotFound() {
        assertThrows(IllegalArgumentException.class, () ->
            gameService.getGameSession(UUID.randomUUID()));
    }
}
