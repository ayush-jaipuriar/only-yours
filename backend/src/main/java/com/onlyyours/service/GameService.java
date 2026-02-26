package com.onlyyours.service;

import com.onlyyours.dto.*;
import com.onlyyours.model.*;
import com.onlyyours.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class GameService {

    private final GameSessionRepository gameSessionRepository;
    private final GameAnswerRepository gameAnswerRepository;
    private final QuestionRepository questionRepository;
    private final QuestionCategoryRepository categoryRepository;
    private final UserRepository userRepository;
    private final CoupleRepository coupleRepository;

    private static final int QUESTIONS_PER_GAME = 8;
    private static final long SESSION_TTL_MILLIS = Duration.ofDays(7).toMillis();
    private static final EnumSet<GameSession.GameStatus> ACTIVE_STATUSES = EnumSet.of(
            GameSession.GameStatus.INVITED,
            GameSession.GameStatus.ROUND1,
            GameSession.GameStatus.ROUND2
    );
    private static final EnumSet<GameSession.GameStatus> ACCEPTED_INVITATION_STATUSES = EnumSet.of(
            GameSession.GameStatus.ROUND1,
            GameSession.GameStatus.ROUND2,
            GameSession.GameStatus.COMPLETED,
            GameSession.GameStatus.EXPIRED
    );

    @Transactional
    public GameInvitationDto createInvitation(UUID inviterId, Integer categoryId) {
        log.info("Creating game invitation: inviter={}, category={}", inviterId, categoryId);

        User inviter = userRepository.findById(inviterId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + inviterId));
        
        Couple couple = coupleRepository.findByUser1_IdOrUser2_Id(inviterId, inviterId)
                .orElseThrow(() -> new IllegalStateException("User must be in a couple to play"));

        QuestionCategory category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new IllegalArgumentException("Category not found: " + categoryId));

        Optional<GameSession> existingActiveSession = findLatestActiveSessionForCouple(couple.getId());
        if (existingActiveSession.isPresent()) {
            throw new ActiveGameSessionExistsException(existingActiveSession.get().getId());
        }

        GameSession session = new GameSession();
        session.setCouple(couple);
        session.setStatus(GameSession.GameStatus.INVITED);
        session.setCategoryId(categoryId);
        Date now = new Date();
        session.setCreatedAt(now);
        session.setExpiresAt(new Date(now.getTime() + SESSION_TTL_MILLIS));
        session.setLastActivityAt(now);
        session.setCurrentQuestionIndex(0);

        try {
            gameSessionRepository.save(session);
        } catch (DataIntegrityViolationException e) {
            Optional<GameSession> activeSessionAfterCollision = findLatestActiveSessionForCouple(couple.getId());
            if (activeSessionAfterCollision.isPresent()) {
                throw new ActiveGameSessionExistsException(activeSessionAfterCollision.get().getId());
            }
            throw e;
        }

        log.info("Game session created: sessionId={}, status=INVITED", session.getId());

        return GameInvitationDto.builder()
                .sessionId(session.getId())
                .categoryId(categoryId)
                .categoryName(category.getName())
                .categoryDescription(category.getDescription())
                .isSensitive(category.isSensitive())
                .inviterId(inviterId)
                .inviterName(inviter.getName())
                .timestamp(System.currentTimeMillis())
                .build();
    }

    @Transactional
    public QuestionPayloadDto acceptInvitation(UUID sessionId, UUID accepterId) {
        log.info("Accepting invitation: sessionId={}, accepter={}", sessionId, accepterId);

        GameSession session = gameSessionRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Game session not found: " + sessionId));
        assertSessionNotExpired(session);

        if (session.getStatus() != GameSession.GameStatus.INVITED) {
            throw new IllegalStateException("Game is not in INVITED state: " + session.getStatus());
        }

        Couple couple = session.getCouple();
        UUID user1Id = couple.getUser1().getId();
        UUID user2Id = couple.getUser2().getId();
        
        if (!accepterId.equals(user1Id) && !accepterId.equals(user2Id)) {
            throw new IllegalStateException("Accepter is not part of this couple");
        }

        List<Question> allQuestions = questionRepository.findByCategory_Id(session.getCategoryId());
        
        if (allQuestions.size() < QUESTIONS_PER_GAME) {
            throw new IllegalStateException(
                String.format("Not enough questions in category. Required: %d, Available: %d", 
                    QUESTIONS_PER_GAME, allQuestions.size())
            );
        }

        Collections.shuffle(allQuestions);
        List<Question> selectedQuestions = allQuestions.stream()
                .limit(QUESTIONS_PER_GAME)
                .collect(Collectors.toList());

        String questionIds = selectedQuestions.stream()
                .map(q -> q.getId().toString())
                .collect(Collectors.joining(","));
        
        session.setQuestionIds(questionIds);
        session.setCurrentQuestionIndex(0);
        session.setStatus(GameSession.GameStatus.ROUND1);
        Date now = new Date();
        session.setStartedAt(now);
        session.setLastActivityAt(now);

        gameSessionRepository.save(session);

        log.info("Game started: sessionId={}, questions={}, count={}", 
                sessionId, questionIds, selectedQuestions.size());

        return buildQuestionPayload(session, selectedQuestions.get(0), 1, "ROUND1");
    }

    @Transactional
    public void declineInvitation(UUID sessionId, UUID declinerId) {
        log.info("Declining invitation: sessionId={}, decliner={}", sessionId, declinerId);

        GameSession session = gameSessionRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Game session not found: " + sessionId));
        assertSessionNotExpired(session);

        Couple couple = session.getCouple();
        UUID user1Id = couple.getUser1().getId();
        UUID user2Id = couple.getUser2().getId();
        if (!declinerId.equals(user1Id) && !declinerId.equals(user2Id)) {
            throw new IllegalStateException("Decliner is not part of this couple");
        }

        session.setStatus(GameSession.GameStatus.DECLINED);
        Date now = new Date();
        session.setCompletedAt(now);
        session.setLastActivityAt(now);
        gameSessionRepository.save(session);
        
        log.info("Invitation declined: sessionId={}", sessionId);
    }

    @Transactional
    public Optional<QuestionPayloadDto> submitAnswer(
            UUID sessionId, 
            UUID userId, 
            Integer questionId, 
            String answer) {
        
        log.info("Submitting answer: session={}, user={}, question={}, answer={}", 
                sessionId, userId, questionId, answer);

        if (!answer.matches("^[A-D]$")) {
            throw new IllegalArgumentException("Answer must be A, B, C, or D. Received: " + answer);
        }

        GameSession session = gameSessionRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Game session not found: " + sessionId));
        assertSessionNotExpired(session);
        ensureUserBelongsToSession(userId, session);

        if (session.getStatus() != GameSession.GameStatus.ROUND1) {
            throw new IllegalStateException("Game is not in ROUND1 state: " + session.getStatus());
        }

        Optional<GameAnswer> existing = gameAnswerRepository
                .findByGameSession_IdAndQuestion_IdAndUser_Id(sessionId, questionId, userId);

        if (existing.isPresent()) {
            log.warn("Answer already recorded for user {}, question {}. Ignoring duplicate.", 
                    userId, questionId);
            return Optional.empty();
        }

        Question question = questionRepository.findById(questionId)
                .orElseThrow(() -> new IllegalArgumentException("Question not found: " + questionId));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

        GameAnswer gameAnswer = new GameAnswer();
        gameAnswer.setGameSession(session);
        gameAnswer.setQuestion(question);
        gameAnswer.setUser(user);
        gameAnswer.setRound1Answer(answer);

        gameAnswerRepository.save(gameAnswer);
        
        log.info("Answer recorded: session={}, user={}, question={}", sessionId, userId, questionId);

        long answerCount = gameAnswerRepository.countByGameSession_IdAndQuestion_Id(sessionId, questionId);

        if (answerCount >= 2) {
            log.info("Both players answered question {}. Advancing...", questionId);

            int currentIndex = Optional.ofNullable(session.getCurrentQuestionIndex()).orElse(0);
            int nextIndex = currentIndex + 1;

            if (nextIndex >= QUESTIONS_PER_GAME) {
                log.info("Round 1 complete for session {}", sessionId);
                session.setStatus(GameSession.GameStatus.ROUND2);
                session.setCurrentQuestionIndex(0);
                session.setLastActivityAt(new Date());
                gameSessionRepository.save(session);
                return Optional.empty();
            }

            String[] questionIdsArray = session.getQuestionIds().split(",");
            Integer nextQuestionId = Integer.parseInt(questionIdsArray[nextIndex]);
            Question nextQuestion = questionRepository.findById(nextQuestionId)
                    .orElseThrow(() -> new IllegalStateException("Question not found: " + nextQuestionId));

            session.setCurrentQuestionIndex(nextIndex);
            session.setLastActivityAt(new Date());
            gameSessionRepository.save(session);

            log.info("Advancing to question {} of {}", nextIndex + 1, QUESTIONS_PER_GAME);
            return Optional.of(buildQuestionPayload(session, nextQuestion, nextIndex + 1, "ROUND1"));
        }

        log.info("Waiting for partner to answer question {}", questionId);
        session.setLastActivityAt(new Date());
        gameSessionRepository.save(session);
        return Optional.empty();
    }

    public boolean areBothPlayersAnswered(UUID sessionId, Integer questionId) {
        long count = gameAnswerRepository.countByGameSession_IdAndQuestion_Id(sessionId, questionId);
        return count >= 2;
    }

    public GameSession getGameSession(UUID sessionId) {
        GameSession session = gameSessionRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Game session not found: " + sessionId));
        assertSessionNotExpired(session);
        return session;
    }

    @Transactional
    public QuestionPayloadDto getFirstRound2Question(UUID sessionId) {
        log.info("Starting Round 2 for session {}", sessionId);
        
        GameSession session = getGameSession(sessionId);
        if (session.getStatus() != GameSession.GameStatus.ROUND2) {
            throw new IllegalStateException("Game is not in ROUND2 state: " + session.getStatus());
        }
        String[] questionIdsArray = session.getQuestionIds().split(",");
        Integer firstQuestionId = Integer.parseInt(questionIdsArray[0].trim());
        Question firstQuestion = questionRepository.findById(firstQuestionId)
                .orElseThrow(() -> new IllegalStateException("Question not found: " + firstQuestionId));
        
        session.setCurrentQuestionIndex(0);
        session.setLastActivityAt(new Date());
        gameSessionRepository.save(session);
        
        return buildQuestionPayload(session, firstQuestion, 1, "ROUND2");
    }

    @Transactional
    public GuessResultDto submitGuess(UUID sessionId, UUID userId, Integer questionId, String guess) {
        log.info("Submitting guess: session={}, user={}, question={}, guess={}",
                sessionId, userId, questionId, guess);

        if (!guess.matches("^[A-D]$")) {
            throw new IllegalArgumentException("Guess must be A, B, C, or D. Received: " + guess);
        }

        GameSession session = getGameSession(sessionId);
        ensureUserBelongsToSession(userId, session);

        if (session.getStatus() != GameSession.GameStatus.ROUND2) {
            throw new IllegalStateException("Game is not in ROUND2 state: " + session.getStatus());
        }

        GameAnswer myAnswer = gameAnswerRepository
                .findByGameSession_IdAndQuestion_IdAndUser_Id(sessionId, questionId, userId)
                .orElseThrow(() -> new IllegalStateException(
                        "No Round 1 answer found for this user and question"));

        if (myAnswer.getRound2Guess() != null) {
            log.warn("Guess already recorded for user {}, question {}. Ignoring duplicate.", userId, questionId);
            return buildGuessResult(session, myAnswer, questionId, userId);
        }

        myAnswer.setRound2Guess(guess);
        gameAnswerRepository.save(myAnswer);
        session.setLastActivityAt(new Date());
        gameSessionRepository.save(session);

        log.info("Guess recorded: session={}, user={}, question={}", sessionId, userId, questionId);

        return buildGuessResult(session, myAnswer, questionId, userId);
    }

    private GuessResultDto buildGuessResult(GameSession session, GameAnswer myAnswer,
                                            Integer questionId, UUID userId) {
        Couple couple = session.getCouple();
        UUID partnerId = couple.getUser1().getId().equals(userId)
                ? couple.getUser2().getId()
                : couple.getUser1().getId();

        GameAnswer partnerAnswer = gameAnswerRepository
                .findByGameSession_IdAndQuestion_IdAndUser_Id(session.getId(), questionId, partnerId)
                .orElseThrow(() -> new IllegalStateException("Partner's Round 1 answer not found"));

        boolean correct = myAnswer.getRound2Guess() != null
                && myAnswer.getRound2Guess().equals(partnerAnswer.getRound1Answer());

        List<GameAnswer> myGuesses = gameAnswerRepository
                .findByGameSession_IdAndUser_IdAndRound2GuessIsNotNull(session.getId(), userId);

        int correctCount = 0;
        for (GameAnswer g : myGuesses) {
            UUID pId = couple.getUser1().getId().equals(userId)
                    ? couple.getUser2().getId()
                    : couple.getUser1().getId();
            Optional<GameAnswer> pAnswer = gameAnswerRepository
                    .findByGameSession_IdAndQuestion_IdAndUser_Id(session.getId(), g.getQuestion().getId(), pId);
            if (pAnswer.isPresent() && g.getRound2Guess() != null
                    && g.getRound2Guess().equals(pAnswer.get().getRound1Answer())) {
                correctCount++;
            }
        }

        String[] questionIdsArray = session.getQuestionIds().split(",");
        int questionNumber = 0;
        for (int i = 0; i < questionIdsArray.length; i++) {
            if (Integer.parseInt(questionIdsArray[i].trim()) == questionId) {
                questionNumber = i + 1;
                break;
            }
        }

        return GuessResultDto.builder()
                .sessionId(session.getId())
                .questionId(questionId)
                .questionNumber(questionNumber)
                .questionText(myAnswer.getQuestion().getText())
                .yourGuess(myAnswer.getRound2Guess())
                .partnerAnswer(partnerAnswer.getRound1Answer())
                .correct(correct)
                .correctCount(correctCount)
                .build();
    }

    public boolean areBothPlayersGuessed(UUID sessionId, Integer questionId) {
        long count = gameAnswerRepository
                .countByGameSession_IdAndQuestion_IdAndRound2GuessIsNotNull(sessionId, questionId);
        return count >= 2;
    }

    @Transactional
    public Optional<QuestionPayloadDto> getNextRound2Question(UUID sessionId) {
        GameSession session = getGameSession(sessionId);
        if (session.getStatus() != GameSession.GameStatus.ROUND2) {
            throw new IllegalStateException("Game is not in ROUND2 state: " + session.getStatus());
        }
        int currentIndex = Optional.ofNullable(session.getCurrentQuestionIndex()).orElse(0);
        int nextIndex = currentIndex + 1;

        if (nextIndex >= QUESTIONS_PER_GAME) {
            log.info("Round 2 complete for session {}", sessionId);
            return Optional.empty();
        }

        String[] questionIdsArray = session.getQuestionIds().split(",");
        Integer nextQuestionId = Integer.parseInt(questionIdsArray[nextIndex].trim());
        Question nextQuestion = questionRepository.findById(nextQuestionId)
                .orElseThrow(() -> new IllegalStateException("Question not found: " + nextQuestionId));

        session.setCurrentQuestionIndex(nextIndex);
        session.setLastActivityAt(new Date());
        gameSessionRepository.save(session);

        log.info("Round 2: advancing to question {} of {}", nextIndex + 1, QUESTIONS_PER_GAME);
        return Optional.of(buildQuestionPayload(session, nextQuestion, nextIndex + 1, "ROUND2"));
    }

    @Transactional
    public GameResultsDto calculateAndCompleteGame(UUID sessionId) {
        log.info("Calculating final scores for session {}", sessionId);

        GameSession session = getGameSession(sessionId);
        Couple couple = session.getCouple();
        User player1 = couple.getUser1();
        User player2 = couple.getUser2();

        List<GameAnswer> allAnswers = gameAnswerRepository
                .findByGameSession_IdOrderByQuestion_Id(sessionId);

        int player1Score = 0;
        int player2Score = 0;

        Map<Integer, List<GameAnswer>> byQuestion = allAnswers.stream()
                .collect(Collectors.groupingBy(a -> a.getQuestion().getId()));

        for (List<GameAnswer> questionAnswers : byQuestion.values()) {
            GameAnswer p1Answer = questionAnswers.stream()
                    .filter(a -> a.getUser().getId().equals(player1.getId()))
                    .findFirst().orElse(null);
            GameAnswer p2Answer = questionAnswers.stream()
                    .filter(a -> a.getUser().getId().equals(player2.getId()))
                    .findFirst().orElse(null);

            if (p1Answer != null && p2Answer != null) {
                if (p1Answer.getRound2Guess() != null
                        && p1Answer.getRound2Guess().equals(p2Answer.getRound1Answer())) {
                    player1Score++;
                }
                if (p2Answer.getRound2Guess() != null
                        && p2Answer.getRound2Guess().equals(p1Answer.getRound1Answer())) {
                    player2Score++;
                }
            }
        }

        session.setPlayer1Score(player1Score);
        session.setPlayer2Score(player2Score);
        session.setStatus(GameSession.GameStatus.COMPLETED);
        Date now = new Date();
        session.setCompletedAt(now);
        session.setLastActivityAt(now);
        gameSessionRepository.save(session);

        log.info("Game completed: session={}, p1Score={}, p2Score={}",
                sessionId, player1Score, player2Score);

        return GameResultsDto.builder()
                .sessionId(sessionId)
                .player1Name(player1.getName())
                .player1Score(player1Score)
                .player2Name(player2.getName())
                .player2Score(player2Score)
                .totalQuestions(QUESTIONS_PER_GAME)
                .message(getResultMessage(player1Score + player2Score))
                .build();
    }

    String getResultMessage(int combinedScore) {
        if (combinedScore >= 14) {
            return "Soulmates! You know each other perfectly!";
        } else if (combinedScore >= 10) {
            return "Great connection! You really know each other.";
        } else if (combinedScore >= 6) {
            return "Good start! Keep playing to learn more.";
        } else {
            return "Lots to discover about each other!";
        }
    }

    @Transactional
    public Optional<ActiveGameSessionDto> getActiveSessionSummary(UUID userId) {
        User currentUser = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

        Optional<Couple> coupleOptional = coupleRepository.findByUser1_IdOrUser2_Id(userId, userId);
        if (coupleOptional.isEmpty()) {
            return Optional.empty();
        }

        Couple couple = coupleOptional.get();
        Optional<GameSession> activeSessionOptional = findLatestActiveSessionForCouple(couple.getId());
        if (activeSessionOptional.isEmpty()) {
            return Optional.empty();
        }

        GameSession session = activeSessionOptional.get();
        User partner = couple.getUser1().getId().equals(currentUser.getId()) ? couple.getUser2() : couple.getUser1();
        Integer[] questionIds = parseQuestionIds(session.getQuestionIds());
        int totalQuestions = questionIds.length > 0 ? questionIds.length : QUESTIONS_PER_GAME;
        int safeIndex = safeCurrentQuestionIndex(session, totalQuestions);
        Integer currentQuestionNumber = session.getStatus() == GameSession.GameStatus.INVITED
                ? null
                : safeIndex + 1;

        String round = switch (session.getStatus()) {
            case ROUND1 -> "ROUND1";
            case ROUND2 -> "ROUND2";
            default -> session.getStatus().name();
        };

        return Optional.of(
                ActiveGameSessionDto.builder()
                        .sessionId(session.getId())
                        .status(session.getStatus().name())
                        .round(round)
                        .categoryId(session.getCategoryId())
                        .currentQuestionNumber(currentQuestionNumber)
                        .totalQuestions(totalQuestions)
                        .partnerName(partner.getName())
                        .createdAt(toEpochMillis(session.getCreatedAt()))
                        .startedAt(toEpochMillis(session.getStartedAt()))
                        .completedAt(toEpochMillis(session.getCompletedAt()))
                        .expiresAt(toEpochMillis(session.getExpiresAt()))
                        .lastActivityAt(toEpochMillis(session.getLastActivityAt()))
                        .canContinue(Boolean.TRUE)
                        .build()
        );
    }

    @Transactional
    public Optional<GameSession> getLatestActiveSessionForUser(UUID userId) {
        Optional<Couple> coupleOptional = coupleRepository.findByUser1_IdOrUser2_Id(userId, userId);
        if (coupleOptional.isEmpty()) {
            return Optional.empty();
        }
        return findLatestActiveSessionForCouple(coupleOptional.get().getId());
    }

    @Transactional
    public Optional<QuestionPayloadDto> getCurrentQuestionForUser(UUID sessionId, UUID userId) {
        GameSession session = getGameSession(sessionId);
        ensureUserBelongsToSession(userId, session);

        if (session.getStatus() != GameSession.GameStatus.ROUND1
                && session.getStatus() != GameSession.GameStatus.ROUND2) {
            return Optional.empty();
        }

        Integer[] questionIds = parseQuestionIds(session.getQuestionIds());
        if (questionIds.length == 0) {
            return Optional.empty();
        }

        int safeIndex = safeCurrentQuestionIndex(session, questionIds.length);
        Integer questionId = questionIds[safeIndex];
        Question question = questionRepository.findById(questionId)
                .orElseThrow(() -> new IllegalStateException("Question not found: " + questionId));

        session.setLastActivityAt(new Date());
        gameSessionRepository.save(session);

        String round = session.getStatus() == GameSession.GameStatus.ROUND2 ? "ROUND2" : "ROUND1";
        return Optional.of(buildQuestionPayload(session, question, safeIndex + 1, round));
    }

    @Transactional(readOnly = true)
    public GameHistoryPageDto getGameHistory(
            UUID userId,
            Integer page,
            Integer size,
            String sort,
            String winnerFilter
    ) {
        userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

        int safePage = page == null || page < 0 ? 0 : page;
        int safeSize = size == null ? 10 : Math.min(Math.max(size, 1), 50);

        List<GameSession> sessions = new ArrayList<>(
                gameSessionRepository.findAllByUserIdAndStatusOrderByCompletedAtDesc(
                        userId,
                        GameSession.GameStatus.COMPLETED
                )
        );
        sessions.sort(buildHistoryComparator(sort));

        List<GameSession> filteredSessions = sessions.stream()
                .filter(session -> matchesWinnerFilter(session, userId, winnerFilter))
                .toList();

        int totalElements = filteredSessions.size();
        int fromIndex = Math.min(safePage * safeSize, totalElements);
        int toIndex = Math.min(fromIndex + safeSize, totalElements);

        List<GameHistoryItemDto> items = filteredSessions.subList(fromIndex, toIndex).stream()
                .map(session -> toGameHistoryItemDto(session, userId))
                .toList();

        int totalPages = totalElements == 0 ? 0 : (int) Math.ceil(totalElements / (double) safeSize);

        return GameHistoryPageDto.builder()
                .items(items)
                .page(safePage)
                .size(safeSize)
                .totalElements((long) totalElements)
                .totalPages(totalPages)
                .hasNext(toIndex < totalElements)
                .build();
    }

    @Transactional(readOnly = true)
    public DashboardStatsDto getDashboardStats(UUID userId) {
        userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

        List<GameSession> completedSessions = gameSessionRepository.findAllByUserIdAndStatusOrderByCompletedAtDesc(
                userId,
                GameSession.GameStatus.COMPLETED
        );
        List<GameSession> allSessions = gameSessionRepository.findAllByUserIdOrderByCreatedAtDesc(userId);

        int gamesPlayed = completedSessions.size();
        int bestScore = completedSessions.stream()
                .mapToInt(session -> resolveMyScore(session, userId))
                .max()
                .orElse(0);
        double averageScore = completedSessions.stream()
                .mapToInt(session -> resolveMyScore(session, userId))
                .average()
                .orElse(0.0);
        int streakDays = calculateConsecutiveStreakDays(completedSessions);

        long respondedInvitationCount = allSessions.stream()
                .filter(session -> session.getStatus() != GameSession.GameStatus.INVITED)
                .count();
        long acceptedInvitationCount = allSessions.stream()
                .filter(session -> ACCEPTED_INVITATION_STATUSES.contains(session.getStatus()))
                .count();
        double invitationAcceptanceRate = respondedInvitationCount == 0
                ? 0.0
                : ((double) acceptedInvitationCount / respondedInvitationCount) * 100.0;

        double avgInvitationResponseSeconds = allSessions.stream()
                .filter(session -> ACCEPTED_INVITATION_STATUSES.contains(session.getStatus()))
                .filter(session -> session.getCreatedAt() != null && session.getStartedAt() != null)
                .mapToLong(session -> session.getStartedAt().getTime() - session.getCreatedAt().getTime())
                .filter(diffMillis -> diffMillis >= 0)
                .average()
                .orElse(0.0) / 1000.0;

        return DashboardStatsDto.builder()
                .gamesPlayed(gamesPlayed)
                .averageScore(roundToTwoDecimals(averageScore))
                .bestScore(bestScore)
                .streakDays(streakDays)
                .invitationAcceptanceRate(roundToTwoDecimals(invitationAcceptanceRate))
                .avgInvitationResponseSeconds(roundToTwoDecimals(avgInvitationResponseSeconds))
                .build();
    }

    @Transactional(readOnly = true)
    public List<BadgeDto> getBadges(UUID userId) {
        userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

        List<GameSession> completedDesc = gameSessionRepository.findAllByUserIdAndStatusOrderByCompletedAtDesc(
                userId,
                GameSession.GameStatus.COMPLETED
        );
        List<GameSession> completedAsc = new ArrayList<>(completedDesc);
        completedAsc.sort(Comparator.comparing(this::resolveSessionReferenceDate, Comparator.nullsLast(Date::compareTo)));

        DashboardStatsDto stats = getDashboardStats(userId);
        List<BadgeDto> badges = new ArrayList<>();

        if (stats.getGamesPlayed() >= 1) {
            badges.add(BadgeDto.builder()
                    .code("FIRST_GAME")
                    .title("First Spark")
                    .description("Complete your first game together.")
                    .earnedAt(resolveNthCompletionTimestamp(completedAsc, 1))
                    .build());
        }
        if (stats.getGamesPlayed() >= 5) {
            badges.add(BadgeDto.builder()
                    .code("FIVE_GAMES")
                    .title("Rhythm Builders")
                    .description("Complete 5 games as a couple.")
                    .earnedAt(resolveNthCompletionTimestamp(completedAsc, 5))
                    .build());
        }
        if (stats.getGamesPlayed() >= 10) {
            badges.add(BadgeDto.builder()
                    .code("TEN_GAMES")
                    .title("Deeply In Sync")
                    .description("Complete 10 games as a couple.")
                    .earnedAt(resolveNthCompletionTimestamp(completedAsc, 10))
                    .build());
        }
        if (stats.getBestScore() >= 7) {
            badges.add(BadgeDto.builder()
                    .code("SHARP_GUESSER")
                    .title("Sharp Guesser")
                    .description("Score at least 7 in a single game.")
                    .earnedAt(resolveScoreThresholdTimestamp(completedAsc, userId, 7))
                    .build());
        }
        if (stats.getStreakDays() >= 3) {
            badges.add(BadgeDto.builder()
                    .code("STREAK_3")
                    .title("Hot Streak")
                    .description("Play on 3 consecutive days.")
                    .earnedAt(resolveLatestCompletionTimestamp(completedDesc))
                    .build());
        }
        if (stats.getInvitationAcceptanceRate() >= 70.0 && stats.getGamesPlayed() >= 3) {
            badges.add(BadgeDto.builder()
                    .code("RESPONSIVE_COUPLE")
                    .title("Responsive Couple")
                    .description("Keep your invitation acceptance rate above 70%.")
                    .earnedAt(resolveLatestCompletionTimestamp(completedDesc))
                    .build());
        }

        return badges;
    }

    private Optional<GameSession> findLatestActiveSessionForCouple(UUID coupleId) {
        List<GameSession> candidateSessions =
                gameSessionRepository.findByCouple_IdAndStatusIn(coupleId, ACTIVE_STATUSES);
        if (candidateSessions.isEmpty()) {
            return Optional.empty();
        }

        Date now = new Date();
        List<GameSession> expiredSessions = new ArrayList<>();
        List<GameSession> activeSessions = new ArrayList<>();

        for (GameSession session : candidateSessions) {
            if (expireIfNeeded(session, now)) {
                expiredSessions.add(session);
                continue;
            }
            activeSessions.add(session);
        }

        if (!expiredSessions.isEmpty()) {
            gameSessionRepository.saveAll(expiredSessions);
        }

        return activeSessions.stream()
                .max(Comparator.comparing(GameSession::getCreatedAt, Comparator.nullsLast(Date::compareTo)));
    }

    private boolean expireIfNeeded(GameSession session, Date now) {
        if (!ACTIVE_STATUSES.contains(session.getStatus())) {
            return false;
        }

        if (session.getCreatedAt() == null) {
            session.setCreatedAt(now);
        }
        Date createdAt = session.getCreatedAt();
        if (session.getExpiresAt() == null) {
            session.setExpiresAt(new Date(createdAt.getTime() + SESSION_TTL_MILLIS));
        }
        if (session.getLastActivityAt() == null) {
            session.setLastActivityAt(createdAt);
        }

        Date expiresAt = session.getExpiresAt();
        if (expiresAt.after(now)) {
            return false;
        }

        session.setStatus(GameSession.GameStatus.EXPIRED);
        if (session.getCompletedAt() == null) {
            session.setCompletedAt(now);
        }
        session.setLastActivityAt(now);
        log.info("Session auto-expired: sessionId={}", session.getId());
        return true;
    }

    private void assertSessionNotExpired(GameSession session) {
        Date now = new Date();
        if (expireIfNeeded(session, now)) {
            gameSessionRepository.save(session);
            throw new SessionExpiredException(session.getId());
        }
    }

    private Integer[] parseQuestionIds(String questionIdsCsv) {
        if (questionIdsCsv == null || questionIdsCsv.isBlank()) {
            return new Integer[0];
        }

        return Arrays.stream(questionIdsCsv.split(","))
                .map(String::trim)
                .filter(value -> !value.isEmpty())
                .map(Integer::parseInt)
                .toArray(Integer[]::new);
    }

    private int safeCurrentQuestionIndex(GameSession session, int totalQuestions) {
        int currentIndex = Optional.ofNullable(session.getCurrentQuestionIndex()).orElse(0);
        if (currentIndex < 0) {
            return 0;
        }
        if (totalQuestions <= 0) {
            return 0;
        }
        if (currentIndex >= totalQuestions) {
            return totalQuestions - 1;
        }
        return currentIndex;
    }

    private Comparator<GameSession> buildHistoryComparator(String sortOrder) {
        Comparator<GameSession> comparator = Comparator
                .comparing(this::resolveSessionReferenceDate, Comparator.nullsLast(Date::compareTo))
                .thenComparing(GameSession::getCreatedAt, Comparator.nullsLast(Date::compareTo));
        if ("oldest".equalsIgnoreCase(sortOrder)) {
            return comparator;
        }
        return comparator.reversed();
    }

    private boolean matchesWinnerFilter(GameSession session, UUID userId, String winnerFilter) {
        int myScore = resolveMyScore(session, userId);
        int partnerScore = resolvePartnerScore(session, userId);
        String normalized = winnerFilter == null ? "all" : winnerFilter.trim().toLowerCase(Locale.ROOT);

        return switch (normalized) {
            case "self" -> myScore > partnerScore;
            case "partner" -> myScore < partnerScore;
            default -> true;
        };
    }

    private GameHistoryItemDto toGameHistoryItemDto(GameSession session, UUID userId) {
        Couple couple = session.getCouple();
        boolean isUser1 = couple.getUser1().getId().equals(userId);
        String partnerName = isUser1 ? couple.getUser2().getName() : couple.getUser1().getName();
        int myScore = resolveMyScore(session, userId);
        int partnerScore = resolvePartnerScore(session, userId);

        String result;
        if (myScore > partnerScore) {
            result = "WIN";
        } else if (myScore < partnerScore) {
            result = "LOSS";
        } else {
            result = "DRAW";
        }

        return GameHistoryItemDto.builder()
                .sessionId(session.getId())
                .completedAt(toEpochMillis(resolveSessionReferenceDate(session)))
                .myScore(myScore)
                .partnerScore(partnerScore)
                .partnerName(partnerName)
                .categoryId(session.getCategoryId())
                .result(result)
                .build();
    }

    private int resolveMyScore(GameSession session, UUID userId) {
        boolean isUser1 = session.getCouple().getUser1().getId().equals(userId);
        Integer myScore = isUser1 ? session.getPlayer1Score() : session.getPlayer2Score();
        return myScore == null ? 0 : myScore;
    }

    private int resolvePartnerScore(GameSession session, UUID userId) {
        boolean isUser1 = session.getCouple().getUser1().getId().equals(userId);
        Integer partnerScore = isUser1 ? session.getPlayer2Score() : session.getPlayer1Score();
        return partnerScore == null ? 0 : partnerScore;
    }

    private int calculateConsecutiveStreakDays(List<GameSession> completedSessions) {
        List<LocalDate> completionDates = completedSessions.stream()
                .map(this::resolveSessionReferenceDate)
                .filter(Objects::nonNull)
                .map(date -> date.toInstant().atZone(ZoneId.systemDefault()).toLocalDate())
                .distinct()
                .sorted(Comparator.reverseOrder())
                .toList();

        if (completionDates.isEmpty()) {
            return 0;
        }

        int streak = 1;
        LocalDate expectedNextDate = completionDates.get(0).minusDays(1);
        for (int i = 1; i < completionDates.size(); i++) {
            LocalDate current = completionDates.get(i);
            if (!current.equals(expectedNextDate)) {
                break;
            }
            streak++;
            expectedNextDate = expectedNextDate.minusDays(1);
        }
        return streak;
    }

    private Long resolveNthCompletionTimestamp(List<GameSession> completedAsc, int n) {
        if (n <= 0 || completedAsc.size() < n) {
            return null;
        }
        return toEpochMillis(resolveSessionReferenceDate(completedAsc.get(n - 1)));
    }

    private Long resolveScoreThresholdTimestamp(List<GameSession> completedAsc, UUID userId, int threshold) {
        return completedAsc.stream()
                .filter(session -> resolveMyScore(session, userId) >= threshold)
                .map(this::resolveSessionReferenceDate)
                .filter(Objects::nonNull)
                .findFirst()
                .map(this::toEpochMillis)
                .orElse(null);
    }

    private Long resolveLatestCompletionTimestamp(List<GameSession> completedDesc) {
        return completedDesc.stream()
                .map(this::resolveSessionReferenceDate)
                .filter(Objects::nonNull)
                .findFirst()
                .map(this::toEpochMillis)
                .orElse(null);
    }

    private Date resolveSessionReferenceDate(GameSession session) {
        if (session.getCompletedAt() != null) {
            return session.getCompletedAt();
        }
        if (session.getStartedAt() != null) {
            return session.getStartedAt();
        }
        return session.getCreatedAt();
    }

    private double roundToTwoDecimals(double value) {
        return BigDecimal.valueOf(value)
                .setScale(2, RoundingMode.HALF_UP)
                .doubleValue();
    }

    private void ensureUserBelongsToSession(UUID userId, GameSession session) {
        Couple couple = session.getCouple();
        boolean userBelongsToCouple = couple.getUser1().getId().equals(userId)
                || couple.getUser2().getId().equals(userId);
        if (!userBelongsToCouple) {
            throw new IllegalStateException("User is not part of this game session");
        }
    }

    private Long toEpochMillis(Date value) {
        return value == null ? null : value.getTime();
    }

    private QuestionPayloadDto buildQuestionPayload(
            GameSession session,
            Question question,
            int questionNumber,
            String round) {

        return QuestionPayloadDto.builder()
                .sessionId(session.getId())
                .questionId(question.getId())
                .questionNumber(questionNumber)
                .totalQuestions(QUESTIONS_PER_GAME)
                .questionText(question.getText())
                .optionA(question.getOptionA())
                .optionB(question.getOptionB())
                .optionC(question.getOptionC())
                .optionD(question.getOptionD())
                .round(round)
                .build();
    }
}
