package com.onlyyours.service;

import com.onlyyours.dto.GameInvitationDto;
import com.onlyyours.dto.GameRoundStateDto;
import com.onlyyours.dto.GameResultsDto;
import com.onlyyours.dto.GuessResultDto;
import com.onlyyours.dto.ActiveGameSessionDto;
import com.onlyyours.dto.BadgeDto;
import com.onlyyours.dto.DashboardStatsDto;
import com.onlyyours.dto.GameHistoryPageDto;
import com.onlyyours.dto.QuestionPayloadDto;
import com.onlyyours.model.*;
import com.onlyyours.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Date;
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

    private GameSession createCompletedHistoricalSession(
            int player1Score,
            int player2Score,
            int daysAgo,
            long inviteResponseSeconds
    ) {
        long now = System.currentTimeMillis();
        Date createdAt = new Date(now - (daysAgo * 24L * 60L * 60L * 1000L) - (2L * 60L * 60L * 1000L));
        Date startedAt = new Date(createdAt.getTime() + (inviteResponseSeconds * 1000L));
        Date completedAt = new Date(createdAt.getTime() + (3L * 60L * 60L * 1000L));

        GameSession session = new GameSession();
        session.setCouple(couple);
        session.setStatus(GameSession.GameStatus.COMPLETED);
        session.setCategoryId(category.getId());
        session.setPlayer1Score(player1Score);
        session.setPlayer2Score(player2Score);
        session.setCreatedAt(createdAt);
        session.setStartedAt(startedAt);
        session.setCompletedAt(completedAt);
        session.setLastActivityAt(completedAt);
        session.setExpiresAt(completedAt);
        session.setCurrentQuestionIndex(0);
        return sessionRepo.save(session);
    }

    private GameSession createNonCompletedSession(GameSession.GameStatus status, int daysAgo) {
        long now = System.currentTimeMillis();
        Date createdAt = new Date(now - (daysAgo * 24L * 60L * 60L * 1000L) - (4L * 60L * 60L * 1000L));

        GameSession session = new GameSession();
        session.setCouple(couple);
        session.setStatus(status);
        session.setCategoryId(category.getId());
        session.setCreatedAt(createdAt);
        session.setLastActivityAt(createdAt);
        session.setExpiresAt(new Date(createdAt.getTime() + (7L * 24L * 60L * 60L * 1000L)));

        if (status == GameSession.GameStatus.DECLINED) {
            Date completedAt = new Date(createdAt.getTime() + (60L * 60L * 1000L));
            session.setCompletedAt(completedAt);
            session.setLastActivityAt(completedAt);
        }

        return sessionRepo.save(session);
    }

    private Question createCustomQuestion(User author, String text) {
        Question question = new Question();
        question.setSourceType(Question.SourceType.CUSTOM_COUPLE);
        question.setCouple(couple);
        question.setCreatedBy(author);
        question.setText(text);
        question.setOptionA("A");
        question.setOptionB("B");
        question.setOptionC("C");
        question.setOptionD("D");
        return questionRepo.save(question);
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
    void testCreateInvitation_WhenActiveSessionExists_ThrowsActiveGameSessionExistsException() {
        GameInvitationDto first = gameService.createInvitation(user1.getId(), category.getId());

        ActiveGameSessionExistsException exception = assertThrows(
                ActiveGameSessionExistsException.class,
                () -> gameService.createInvitation(user1.getId(), category.getId())
        );

        assertEquals(first.getSessionId(), exception.getSessionId());
    }

    @Test
    void testCreateInvitation_WhenExistingActiveSessionExpired_AllowsNewSession() {
        GameInvitationDto first = gameService.createInvitation(user1.getId(), category.getId());
        GameSession firstSession = sessionRepo.findById(first.getSessionId()).orElseThrow();
        firstSession.setExpiresAt(new Date(System.currentTimeMillis() - 60_000));
        sessionRepo.save(firstSession);

        GameInvitationDto second = gameService.createInvitation(user1.getId(), category.getId());
        assertNotEquals(first.getSessionId(), second.getSessionId());
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
    void testCreateAndAcceptCustomInvitation_Success() {
        for (int i = 0; i < 4; i++) {
            createCustomQuestion(user1, "Custom question A" + i + "?");
            createCustomQuestion(user2, "Custom question B" + i + "?");
        }

        GameInvitationDto invitation = gameService.createCustomInvitation(user1.getId());

        assertEquals("CUSTOM_COUPLE", invitation.getDeckType());
        assertEquals("Custom Couple Questions", invitation.getCategoryName());

        QuestionPayloadDto firstQuestion = gameService.acceptInvitation(invitation.getSessionId(), user2.getId());

        assertTrue(firstQuestion.getCustomQuestion());
        GameSession session = sessionRepo.findById(invitation.getSessionId()).orElseThrow();
        assertEquals(GameSession.DeckType.CUSTOM_COUPLE, session.getDeckType());
    }

    @Test
    void testAcceptInvitation_AlreadyAccepted_ReturnsCurrentQuestion() {
        GameInvitationDto invitation = gameService.createInvitation(user1.getId(), category.getId());

        QuestionPayloadDto firstQuestion = gameService.acceptInvitation(invitation.getSessionId(), user2.getId());
        QuestionPayloadDto resumedQuestion = gameService.acceptInvitation(invitation.getSessionId(), user2.getId());

        assertEquals(firstQuestion.getSessionId(), resumedQuestion.getSessionId());
        assertEquals(firstQuestion.getQuestionId(), resumedQuestion.getQuestionId());
        assertEquals("ROUND1", resumedQuestion.getRound());
    }

    @Test
    void testDeclineInvitation_Success() {
        GameInvitationDto invitation = gameService.createInvitation(user1.getId(), category.getId());

        boolean declined = gameService.declineInvitation(invitation.getSessionId(), user2.getId());

        GameSession session = sessionRepo.findById(invitation.getSessionId()).orElseThrow();
        assertTrue(declined);
        assertEquals(GameSession.GameStatus.DECLINED, session.getStatus());
    }

    @Test
    void testDeclineInvitation_AfterAcceptance_IsNoOp() {
        GameInvitationDto invitation = gameService.createInvitation(user1.getId(), category.getId());
        gameService.acceptInvitation(invitation.getSessionId(), user2.getId());

        boolean declined = gameService.declineInvitation(invitation.getSessionId(), user2.getId());

        GameSession session = sessionRepo.findById(invitation.getSessionId()).orElseThrow();
        assertFalse(declined);
        assertEquals(GameSession.GameStatus.ROUND1, session.getStatus());
    }

    @Test
    void testSubmitAnswer_FirstPlayer() {
        GameInvitationDto invitation = gameService.createInvitation(user1.getId(), category.getId());
        QuestionPayloadDto firstQ = gameService.acceptInvitation(
                invitation.getSessionId(), user2.getId());

        Optional<QuestionPayloadDto> nextQuestion = gameService.submitAnswer(
                invitation.getSessionId(), user1.getId(), firstQ.getQuestionId(), "A");

        assertTrue(nextQuestion.isPresent(), "Player should immediately advance to their own next unanswered question");
        assertEquals(2, nextQuestion.get().getQuestionNumber());
        assertEquals("ROUND1", nextQuestion.get().getRound());

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

        assertTrue(afterFirst.isPresent(), "First player should move ahead independently");
        assertTrue(afterSecond.isPresent(), "Second player should also move to their own next question");

        QuestionPayloadDto nextQForFirstPlayer = afterFirst.get();
        assertEquals(2, nextQForFirstPlayer.getQuestionNumber());
        assertEquals(invitation.getSessionId(), nextQForFirstPlayer.getSessionId());

        QuestionPayloadDto nextQForSecondPlayer = afterSecond.get();
        assertEquals(2, nextQForSecondPlayer.getQuestionNumber());
        assertEquals(invitation.getSessionId(), nextQForSecondPlayer.getSessionId());

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

        assertTrue(finalResult.isPresent(), "Last finisher should immediately receive the first Round 2 question");
        assertEquals("ROUND2", finalResult.get().getRound());
        assertEquals(1, finalResult.get().getQuestionNumber());

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

        assertTrue(duplicate.isPresent(), "Duplicate submit should return the same player's next unanswered question");
        assertEquals(2, duplicate.get().getQuestionNumber());
        assertEquals("ROUND1", duplicate.get().getRound());

        long count = answerRepo.countByGameSession_IdAndQuestion_Id(
                invitation.getSessionId(), firstQ.getQuestionId());
        assertEquals(1, count, "Should only have one answer despite duplicate submission");
    }

    @Test
    void testSubmitAnswer_DuplicateAfterBothAnswersRecorded_RecoversStuckWaitingState() {
        GameInvitationDto invitation = gameService.createInvitation(user1.getId(), category.getId());
        QuestionPayloadDto firstQ = gameService.acceptInvitation(
                invitation.getSessionId(), user2.getId());

        GameSession session = sessionRepo.findById(invitation.getSessionId()).orElseThrow();
        Question question = questionRepo.findById(firstQ.getQuestionId()).orElseThrow();

        GameAnswer user1Answer = new GameAnswer();
        user1Answer.setGameSession(session);
        user1Answer.setQuestion(question);
        user1Answer.setUser(user1);
        user1Answer.setRound1Answer("A");
        answerRepo.save(user1Answer);

        GameAnswer user2Answer = new GameAnswer();
        user2Answer.setGameSession(session);
        user2Answer.setQuestion(question);
        user2Answer.setUser(user2);
        user2Answer.setRound1Answer("B");
        answerRepo.save(user2Answer);

        Optional<QuestionPayloadDto> recovered = gameService.submitAnswer(
                invitation.getSessionId(),
                user1.getId(),
                firstQ.getQuestionId(),
                "A"
        );

        assertTrue(recovered.isPresent(), "Duplicate submission should recover stale waiting state");
        assertEquals(2, recovered.get().getQuestionNumber());

        GameSession updated = sessionRepo.findById(invitation.getSessionId()).orElseThrow();
        assertEquals(GameSession.GameStatus.ROUND1, updated.getStatus());
        assertEquals(0, updated.getCurrentQuestionIndex(), "Shared question index is no longer the source of truth");
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

    @Test
    void testGetActiveSessionSummary_ReturnsSessionForCoupledUser() {
        GameInvitationDto invitation = gameService.createInvitation(user1.getId(), category.getId());

        Optional<ActiveGameSessionDto> summary = gameService.getActiveSessionSummary(user1.getId());

        assertTrue(summary.isPresent());
        assertEquals(invitation.getSessionId(), summary.get().getSessionId());
        assertEquals("INVITED", summary.get().getStatus());
        assertEquals(true, summary.get().getCanContinue());
    }

    @Test
    void testGetCurrentQuestionForUser_ReturnsCurrentRound1Question() {
        GameInvitationDto invitation = gameService.createInvitation(user1.getId(), category.getId());
        QuestionPayloadDto first = gameService.acceptInvitation(invitation.getSessionId(), user2.getId());

        Optional<Object> currentQuestion =
                gameService.getCurrentQuestionForUser(invitation.getSessionId(), user1.getId());

        assertTrue(currentQuestion.isPresent());
        assertInstanceOf(QuestionPayloadDto.class, currentQuestion.get());
        QuestionPayloadDto payload = (QuestionPayloadDto) currentQuestion.get();
        assertEquals(first.getQuestionId(), payload.getQuestionId());
        assertEquals("ROUND1", payload.getRound());
        assertEquals(1, payload.getQuestionNumber());
    }

    @Test
    void testGetCurrentQuestionForUser_RecoversStuckRound1AndAdvances() {
        GameInvitationDto invitation = gameService.createInvitation(user1.getId(), category.getId());
        QuestionPayloadDto first = gameService.acceptInvitation(invitation.getSessionId(), user2.getId());

        GameSession session = sessionRepo.findById(invitation.getSessionId()).orElseThrow();
        Question question = questionRepo.findById(first.getQuestionId()).orElseThrow();

        GameAnswer user1Answer = new GameAnswer();
        user1Answer.setGameSession(session);
        user1Answer.setQuestion(question);
        user1Answer.setUser(user1);
        user1Answer.setRound1Answer("A");
        answerRepo.save(user1Answer);

        GameAnswer user2Answer = new GameAnswer();
        user2Answer.setGameSession(session);
        user2Answer.setQuestion(question);
        user2Answer.setUser(user2);
        user2Answer.setRound1Answer("B");
        answerRepo.save(user2Answer);

        Optional<Object> recovered =
                gameService.getCurrentQuestionForUser(invitation.getSessionId(), user1.getId());

        assertTrue(recovered.isPresent());
        assertInstanceOf(QuestionPayloadDto.class, recovered.get());
        QuestionPayloadDto payload = (QuestionPayloadDto) recovered.get();
        assertEquals("ROUND1", payload.getRound());
        assertEquals(2, payload.getQuestionNumber());
    }

    @Test
    void testGetCurrentQuestionForUser_WhenPlayerFinishesRound1Early_ReturnsWaitingReviewState() {
        GameInvitationDto invitation = gameService.createInvitation(user1.getId(), category.getId());
        QuestionPayloadDto currentQuestion = gameService.acceptInvitation(invitation.getSessionId(), user2.getId());

        for (int i = 0; i < 8; i++) {
            Optional<QuestionPayloadDto> nextQuestion = gameService.submitAnswer(
                    invitation.getSessionId(),
                    user1.getId(),
                    currentQuestion.getQuestionId(),
                    "A"
            );
            if (nextQuestion.isPresent()) {
                currentQuestion = nextQuestion.get();
            }
        }

        Optional<Object> currentState =
                gameService.getCurrentQuestionForUser(invitation.getSessionId(), user1.getId());

        assertTrue(currentState.isPresent());
        assertInstanceOf(GameRoundStateDto.class, currentState.get());
        GameRoundStateDto roundState = (GameRoundStateDto) currentState.get();
        assertEquals("ROUND1", roundState.getRound());
        assertEquals("WAITING_FOR_PARTNER", roundState.getStatus());
        assertEquals(8, roundState.getCompletedCount());
        assertEquals(8, roundState.getReviewItems().size());
        assertEquals("A", roundState.getReviewItems().get(0).getSubmittedValue());
    }

    @Test
    void testSubmitAnswer_WhenSessionExpired_ThrowsSessionExpiredException() {
        GameInvitationDto invitation = gameService.createInvitation(user1.getId(), category.getId());
        QuestionPayloadDto first = gameService.acceptInvitation(invitation.getSessionId(), user2.getId());
        GameSession session = sessionRepo.findById(invitation.getSessionId()).orElseThrow();
        session.setExpiresAt(new Date(System.currentTimeMillis() - 60_000));
        sessionRepo.save(session);

        assertThrows(
                SessionExpiredException.class,
                () -> gameService.submitAnswer(invitation.getSessionId(), user1.getId(), first.getQuestionId(), "A")
        );

        GameSession updated = sessionRepo.findById(invitation.getSessionId()).orElseThrow();
        assertEquals(GameSession.GameStatus.EXPIRED, updated.getStatus());
    }

    @Test
    void testGetGameHistory_PaginatesAndAppliesWinnerFilter() {
        createCompletedHistoricalSession(7, 4, 0, 120);
        createCompletedHistoricalSession(3, 6, 1, 90);
        createCompletedHistoricalSession(5, 5, 2, 60);

        GameHistoryPageDto historyPage = gameService.getGameHistory(user1.getId(), 0, 2, "recent", "all");
        assertEquals(3L, historyPage.getTotalElements());
        assertEquals(2, historyPage.getItems().size());
        assertTrue(historyPage.getHasNext());
        assertEquals("WIN", historyPage.getItems().get(0).getResult());

        GameHistoryPageDto selfWins = gameService.getGameHistory(user1.getId(), 0, 10, "recent", "self");
        assertEquals(1L, selfWins.getTotalElements());
        assertEquals("WIN", selfWins.getItems().get(0).getResult());

        GameHistoryPageDto partnerWins = gameService.getGameHistory(user1.getId(), 0, 10, "recent", "partner");
        assertEquals(1L, partnerWins.getTotalElements());
        assertEquals("LOSS", partnerWins.getItems().get(0).getResult());
    }

    @Test
    void testGetDashboardStats_ComputesAggregateMetrics() {
        createCompletedHistoricalSession(6, 4, 0, 120);
        createCompletedHistoricalSession(4, 7, 1, 60);
        createNonCompletedSession(GameSession.GameStatus.DECLINED, 2);
        createNonCompletedSession(GameSession.GameStatus.INVITED, 3);

        DashboardStatsDto stats = gameService.getDashboardStats(user1.getId());
        assertEquals(2, stats.getGamesPlayed());
        assertEquals(5.0, stats.getAverageScore());
        assertEquals(6, stats.getBestScore());
        assertEquals(2, stats.getStreakDays());
        assertEquals(66.67, stats.getInvitationAcceptanceRate());
        assertEquals(90.0, stats.getAvgInvitationResponseSeconds());
    }

    @Test
    void testGetBadges_ReturnsEligibleMilestones() {
        createCompletedHistoricalSession(8, 3, 0, 60);
        createCompletedHistoricalSession(7, 5, 1, 60);
        createCompletedHistoricalSession(6, 4, 2, 60);
        createCompletedHistoricalSession(5, 4, 3, 60);
        createCompletedHistoricalSession(4, 2, 4, 60);

        List<BadgeDto> badges = gameService.getBadges(user1.getId());
        List<String> badgeCodes = badges.stream().map(BadgeDto::getCode).toList();

        assertTrue(badgeCodes.contains("FIRST_GAME"));
        assertTrue(badgeCodes.contains("FIVE_GAMES"));
        assertTrue(badgeCodes.contains("SHARP_GUESSER"));
        assertTrue(badgeCodes.contains("STREAK_3"));
        assertTrue(badgeCodes.contains("RESPONSIVE_COUPLE"));
        assertFalse(badgeCodes.contains("TEN_GAMES"));
        assertTrue(badges.stream().allMatch(badge -> badge.getEarnedAt() != null));
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
    void testResolveCurrentStateAfterGuessSubmission_CompletesGameOnFinalGuess() {
        GameInvitationDto invitation = gameService.createInvitation(user1.getId(), category.getId());
        playRound1ToCompletion(invitation.getSessionId());

        QuestionPayloadDto user1Current = gameService.getFirstRound2Question(invitation.getSessionId());
        QuestionPayloadDto user2Current = user1Current;
        Optional<Object> user1View = Optional.empty();
        Optional<Object> user2View = Optional.empty();

        for (int i = 0; i < 8; i++) {
            gameService.submitGuess(invitation.getSessionId(), user1.getId(), user1Current.getQuestionId(), "B");
            user1View = gameService.resolveCurrentStateAfterGuessSubmission(
                    invitation.getSessionId(),
                    user1.getId()
            );

            gameService.submitGuess(invitation.getSessionId(), user2.getId(), user2Current.getQuestionId(), "A");
            user2View = gameService.resolveCurrentStateAfterGuessSubmission(
                    invitation.getSessionId(),
                    user2.getId()
            );

            if (i < 7) {
                assertTrue(user1View.isPresent());
                assertTrue(user2View.isPresent());
                assertInstanceOf(QuestionPayloadDto.class, user1View.get());
                assertInstanceOf(QuestionPayloadDto.class, user2View.get());
                user1Current = (QuestionPayloadDto) user1View.get();
                user2Current = (QuestionPayloadDto) user2View.get();
            }
        }

        assertTrue(user1View.isPresent());
        assertInstanceOf(GameRoundStateDto.class, user1View.get());
        assertTrue(user2View.isPresent());
        assertInstanceOf(GameResultsDto.class, user2View.get());

        GameSession completedSession = sessionRepo.findById(invitation.getSessionId()).orElseThrow();
        assertEquals(GameSession.GameStatus.COMPLETED, completedSession.getStatus());
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
        assertNotNull(results.getCoupleProgression());
        assertTrue(results.getCoupleProgression().getLevel() >= 1);
        assertFalse(results.getRecentMilestones().isEmpty());
        assertTrue(results.getRecentMilestones().stream().allMatch(milestone -> "COUPLE".equals(milestone.getScope())));

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
        assertNotNull(results.getCoupleProgression());
        assertFalse(results.getRecentMilestones().isEmpty());
        assertTrue(results.getRecentMilestones().stream().allMatch(milestone -> "COUPLE".equals(milestone.getScope())));

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
