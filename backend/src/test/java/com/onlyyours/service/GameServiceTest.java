package com.onlyyours.service;

import com.onlyyours.dto.GameInvitationDto;
import com.onlyyours.dto.GameResultsDto;
import com.onlyyours.dto.GuessResultDto;
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

    // ============================================================
    // Sprint 5: Round 2 (Guessing) & Results Tests
    // ============================================================

    private QuestionPayloadDto playRound1ToCompletion(UUID sessionId) {
        QuestionPayloadDto currentQ = gameService.acceptInvitation(sessionId, user2.getId());
        for (int i = 0; i < 7; i++) {
            gameService.submitAnswer(sessionId, user1.getId(), currentQ.getQuestionId(), "A");
            Optional<QuestionPayloadDto> next = gameService.submitAnswer(
                    sessionId, user2.getId(), currentQ.getQuestionId(), "B");
            if (next.isPresent()) {
                currentQ = next.get();
            }
        }
        gameService.submitAnswer(sessionId, user1.getId(), currentQ.getQuestionId(), "A");
        gameService.submitAnswer(sessionId, user2.getId(), currentQ.getQuestionId(), "B");
        return currentQ;
    }

    @Test
    void testGetFirstRound2Question() {
        GameInvitationDto invitation = gameService.createInvitation(user1.getId(), category.getId());
        playRound1ToCompletion(invitation.getSessionId());

        GameSession session = sessionRepo.findById(invitation.getSessionId()).orElseThrow();
        assertEquals(GameSession.GameStatus.ROUND2, session.getStatus());

        QuestionPayloadDto firstRound2Q = gameService.getFirstRound2Question(invitation.getSessionId());

        assertNotNull(firstRound2Q);
        assertEquals("ROUND2", firstRound2Q.getRound());
        assertEquals(1, firstRound2Q.getQuestionNumber());
        assertEquals(invitation.getSessionId(), firstRound2Q.getSessionId());
    }

    @Test
    void testSubmitGuess_CorrectGuess() {
        GameInvitationDto invitation = gameService.createInvitation(user1.getId(), category.getId());
        playRound1ToCompletion(invitation.getSessionId());

        QuestionPayloadDto r2Q = gameService.getFirstRound2Question(invitation.getSessionId());

        GuessResultDto result = gameService.submitGuess(
                invitation.getSessionId(), user1.getId(), r2Q.getQuestionId(), "B");

        assertNotNull(result);
        assertEquals("GUESS_RESULT", result.getType());
        assertEquals("B", result.getYourGuess());
        assertEquals("B", result.getPartnerAnswer());
        assertTrue(result.isCorrect());
        assertEquals(1, result.getCorrectCount());
    }

    @Test
    void testSubmitGuess_IncorrectGuess() {
        GameInvitationDto invitation = gameService.createInvitation(user1.getId(), category.getId());
        playRound1ToCompletion(invitation.getSessionId());

        QuestionPayloadDto r2Q = gameService.getFirstRound2Question(invitation.getSessionId());

        GuessResultDto result = gameService.submitGuess(
                invitation.getSessionId(), user1.getId(), r2Q.getQuestionId(), "C");

        assertNotNull(result);
        assertFalse(result.isCorrect());
        assertEquals("C", result.getYourGuess());
        assertEquals("B", result.getPartnerAnswer());
        assertEquals(0, result.getCorrectCount());
    }

    @Test
    void testSubmitGuess_InvalidFormat() {
        GameInvitationDto invitation = gameService.createInvitation(user1.getId(), category.getId());
        playRound1ToCompletion(invitation.getSessionId());
        gameService.getFirstRound2Question(invitation.getSessionId());

        assertThrows(IllegalArgumentException.class, () ->
            gameService.submitGuess(invitation.getSessionId(), user1.getId(), 1, "X"));
    }

    @Test
    void testSubmitGuess_WrongGameStatus() {
        GameInvitationDto invitation = gameService.createInvitation(user1.getId(), category.getId());

        assertThrows(IllegalStateException.class, () ->
            gameService.submitGuess(invitation.getSessionId(), user1.getId(), 1, "A"));
    }

    @Test
    void testSubmitGuess_DuplicateGuess_Idempotent() {
        GameInvitationDto invitation = gameService.createInvitation(user1.getId(), category.getId());
        playRound1ToCompletion(invitation.getSessionId());

        QuestionPayloadDto r2Q = gameService.getFirstRound2Question(invitation.getSessionId());

        GuessResultDto first = gameService.submitGuess(
                invitation.getSessionId(), user1.getId(), r2Q.getQuestionId(), "B");
        GuessResultDto duplicate = gameService.submitGuess(
                invitation.getSessionId(), user1.getId(), r2Q.getQuestionId(), "C");

        assertEquals(first.isCorrect(), duplicate.isCorrect());
        assertEquals("B", duplicate.getYourGuess());
    }

    @Test
    void testAreBothPlayersGuessed_NoneGuessed() {
        GameInvitationDto invitation = gameService.createInvitation(user1.getId(), category.getId());
        playRound1ToCompletion(invitation.getSessionId());

        QuestionPayloadDto r2Q = gameService.getFirstRound2Question(invitation.getSessionId());

        assertFalse(gameService.areBothPlayersGuessed(invitation.getSessionId(), r2Q.getQuestionId()));
    }

    @Test
    void testAreBothPlayersGuessed_OneGuessed() {
        GameInvitationDto invitation = gameService.createInvitation(user1.getId(), category.getId());
        playRound1ToCompletion(invitation.getSessionId());

        QuestionPayloadDto r2Q = gameService.getFirstRound2Question(invitation.getSessionId());
        gameService.submitGuess(invitation.getSessionId(), user1.getId(), r2Q.getQuestionId(), "B");

        assertFalse(gameService.areBothPlayersGuessed(invitation.getSessionId(), r2Q.getQuestionId()));
    }

    @Test
    void testAreBothPlayersGuessed_BothGuessed() {
        GameInvitationDto invitation = gameService.createInvitation(user1.getId(), category.getId());
        playRound1ToCompletion(invitation.getSessionId());

        QuestionPayloadDto r2Q = gameService.getFirstRound2Question(invitation.getSessionId());
        gameService.submitGuess(invitation.getSessionId(), user1.getId(), r2Q.getQuestionId(), "B");
        gameService.submitGuess(invitation.getSessionId(), user2.getId(), r2Q.getQuestionId(), "A");

        assertTrue(gameService.areBothPlayersGuessed(invitation.getSessionId(), r2Q.getQuestionId()));
    }

    @Test
    void testGetNextRound2Question_HasMore() {
        GameInvitationDto invitation = gameService.createInvitation(user1.getId(), category.getId());
        playRound1ToCompletion(invitation.getSessionId());
        gameService.getFirstRound2Question(invitation.getSessionId());

        Optional<QuestionPayloadDto> nextQ = gameService.getNextRound2Question(invitation.getSessionId());

        assertTrue(nextQ.isPresent());
        assertEquals(2, nextQ.get().getQuestionNumber());
        assertEquals("ROUND2", nextQ.get().getRound());
    }

    @Test
    void testGetNextRound2Question_LastQuestion() {
        GameInvitationDto invitation = gameService.createInvitation(user1.getId(), category.getId());
        playRound1ToCompletion(invitation.getSessionId());
        gameService.getFirstRound2Question(invitation.getSessionId());

        for (int i = 0; i < 7; i++) {
            Optional<QuestionPayloadDto> q = gameService.getNextRound2Question(invitation.getSessionId());
            assertTrue(q.isPresent(), "Expected question " + (i + 2) + " to be present");
        }

        Optional<QuestionPayloadDto> afterLast = gameService.getNextRound2Question(invitation.getSessionId());
        assertFalse(afterLast.isPresent(), "Should be no question after all 8");
    }

    @Test
    void testCalculateAndCompleteGame_AllCorrect() {
        GameInvitationDto invitation = gameService.createInvitation(user1.getId(), category.getId());
        playRound1ToCompletion(invitation.getSessionId());

        QuestionPayloadDto r2Q = gameService.getFirstRound2Question(invitation.getSessionId());

        for (int i = 0; i < 8; i++) {
            gameService.submitGuess(invitation.getSessionId(), user1.getId(), r2Q.getQuestionId(), "B");
            gameService.submitGuess(invitation.getSessionId(), user2.getId(), r2Q.getQuestionId(), "A");
            Optional<QuestionPayloadDto> next = gameService.getNextRound2Question(invitation.getSessionId());
            if (next.isPresent()) {
                r2Q = next.get();
            }
        }

        GameResultsDto results = gameService.calculateAndCompleteGame(invitation.getSessionId());

        assertEquals(8, results.getPlayer1Score());
        assertEquals(8, results.getPlayer2Score());
        assertEquals("Soulmates! You know each other perfectly!", results.getMessage());

        GameSession session = sessionRepo.findById(invitation.getSessionId()).orElseThrow();
        assertEquals(GameSession.GameStatus.COMPLETED, session.getStatus());
        assertNotNull(session.getCompletedAt());
    }

    @Test
    void testCalculateAndCompleteGame_AllWrong() {
        GameInvitationDto invitation = gameService.createInvitation(user1.getId(), category.getId());
        playRound1ToCompletion(invitation.getSessionId());

        QuestionPayloadDto r2Q = gameService.getFirstRound2Question(invitation.getSessionId());

        for (int i = 0; i < 8; i++) {
            gameService.submitGuess(invitation.getSessionId(), user1.getId(), r2Q.getQuestionId(), "D");
            gameService.submitGuess(invitation.getSessionId(), user2.getId(), r2Q.getQuestionId(), "D");
            Optional<QuestionPayloadDto> next = gameService.getNextRound2Question(invitation.getSessionId());
            if (next.isPresent()) {
                r2Q = next.get();
            }
        }

        GameResultsDto results = gameService.calculateAndCompleteGame(invitation.getSessionId());

        assertEquals(0, results.getPlayer1Score());
        assertEquals(0, results.getPlayer2Score());
        assertEquals("Lots to discover about each other!", results.getMessage());
    }

    @Test
    void testCalculateAndCompleteGame_MixedScores() {
        GameInvitationDto invitation = gameService.createInvitation(user1.getId(), category.getId());
        playRound1ToCompletion(invitation.getSessionId());

        QuestionPayloadDto r2Q = gameService.getFirstRound2Question(invitation.getSessionId());

        for (int i = 0; i < 8; i++) {
            String user1Guess = (i < 5) ? "B" : "D";
            String user2Guess = (i < 3) ? "A" : "D";
            gameService.submitGuess(invitation.getSessionId(), user1.getId(), r2Q.getQuestionId(), user1Guess);
            gameService.submitGuess(invitation.getSessionId(), user2.getId(), r2Q.getQuestionId(), user2Guess);
            Optional<QuestionPayloadDto> next = gameService.getNextRound2Question(invitation.getSessionId());
            if (next.isPresent()) {
                r2Q = next.get();
            }
        }

        GameResultsDto results = gameService.calculateAndCompleteGame(invitation.getSessionId());

        assertEquals(5, results.getPlayer1Score());
        assertEquals(3, results.getPlayer2Score());
        assertEquals("Good start! Keep playing to learn more.", results.getMessage());
    }

    @Test
    void testFullGameLifecycle_Round1ThroughScoring() {
        GameInvitationDto invitation = gameService.createInvitation(user1.getId(), category.getId());

        QuestionPayloadDto currentQ = gameService.acceptInvitation(invitation.getSessionId(), user2.getId());
        assertEquals("ROUND1", currentQ.getRound());

        for (int i = 0; i < 7; i++) {
            gameService.submitAnswer(invitation.getSessionId(), user1.getId(), currentQ.getQuestionId(), "A");
            Optional<QuestionPayloadDto> next = gameService.submitAnswer(
                    invitation.getSessionId(), user2.getId(), currentQ.getQuestionId(), "B");
            assertTrue(next.isPresent(), "Should get next question for question " + (i + 1));
            currentQ = next.get();
            assertEquals("ROUND1", currentQ.getRound());
        }

        gameService.submitAnswer(invitation.getSessionId(), user1.getId(), currentQ.getQuestionId(), "A");
        gameService.submitAnswer(invitation.getSessionId(), user2.getId(), currentQ.getQuestionId(), "B");

        GameSession sessionAfterR1 = sessionRepo.findById(invitation.getSessionId()).orElseThrow();
        assertEquals(GameSession.GameStatus.ROUND2, sessionAfterR1.getStatus());

        QuestionPayloadDto r2Q = gameService.getFirstRound2Question(invitation.getSessionId());
        assertEquals("ROUND2", r2Q.getRound());

        for (int i = 0; i < 8; i++) {
            gameService.submitGuess(invitation.getSessionId(), user1.getId(), r2Q.getQuestionId(), "B");
            gameService.submitGuess(invitation.getSessionId(), user2.getId(), r2Q.getQuestionId(), "A");
            Optional<QuestionPayloadDto> next = gameService.getNextRound2Question(invitation.getSessionId());
            if (next.isPresent()) {
                r2Q = next.get();
                assertEquals("ROUND2", r2Q.getRound());
            }
        }

        GameResultsDto results = gameService.calculateAndCompleteGame(invitation.getSessionId());

        assertEquals(8, results.getPlayer1Score());
        assertEquals(8, results.getPlayer2Score());
        assertEquals(8, results.getTotalQuestions());
        assertNotNull(results.getPlayer1Name());
        assertNotNull(results.getPlayer2Name());
        assertEquals("GAME_RESULTS", results.getType());

        GameSession finalSession = sessionRepo.findById(invitation.getSessionId()).orElseThrow();
        assertEquals(GameSession.GameStatus.COMPLETED, finalSession.getStatus());
        assertNotNull(finalSession.getCompletedAt());
        assertEquals(8, finalSession.getPlayer1Score());
        assertEquals(8, finalSession.getPlayer2Score());
    }

    @Test
    void testGetResultMessage_AllTiers() {
        assertEquals("Soulmates! You know each other perfectly!", gameService.getResultMessage(16));
        assertEquals("Soulmates! You know each other perfectly!", gameService.getResultMessage(14));
        assertEquals("Great connection! You really know each other.", gameService.getResultMessage(13));
        assertEquals("Great connection! You really know each other.", gameService.getResultMessage(10));
        assertEquals("Good start! Keep playing to learn more.", gameService.getResultMessage(9));
        assertEquals("Good start! Keep playing to learn more.", gameService.getResultMessage(6));
        assertEquals("Lots to discover about each other!", gameService.getResultMessage(5));
        assertEquals("Lots to discover about each other!", gameService.getResultMessage(0));
    }
}
