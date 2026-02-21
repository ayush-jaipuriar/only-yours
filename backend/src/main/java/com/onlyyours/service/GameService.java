package com.onlyyours.service;

import com.onlyyours.dto.*;
import com.onlyyours.model.*;
import com.onlyyours.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;
import java.util.concurrent.atomic.AtomicInteger;

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

    @Transactional
    public GameInvitationDto createInvitation(UUID inviterId, Integer categoryId) {
        log.info("Creating game invitation: inviter={}, category={}", inviterId, categoryId);

        User inviter = userRepository.findById(inviterId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + inviterId));
        
        Couple couple = coupleRepository.findByUser1_IdOrUser2_Id(inviterId, inviterId)
                .orElseThrow(() -> new IllegalStateException("User must be in a couple to play"));

        QuestionCategory category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new IllegalArgumentException("Category not found: " + categoryId));

        GameSession session = new GameSession();
        session.setCouple(couple);
        session.setStatus(GameSession.GameStatus.INVITED);
        session.setCategoryId(categoryId);
        session.setCreatedAt(new Date());
        session.setCurrentQuestionIndex(0);

        gameSessionRepository.save(session);

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
        session.setStartedAt(new Date());

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

        session.setStatus(GameSession.GameStatus.DECLINED);
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

            int currentIndex = session.getCurrentQuestionIndex();
            int nextIndex = currentIndex + 1;

            if (nextIndex >= QUESTIONS_PER_GAME) {
                log.info("Round 1 complete for session {}", sessionId);
                session.setStatus(GameSession.GameStatus.ROUND2);
                session.setCurrentQuestionIndex(0);
                gameSessionRepository.save(session);
                return Optional.empty();
            }

            String[] questionIdsArray = session.getQuestionIds().split(",");
            Integer nextQuestionId = Integer.parseInt(questionIdsArray[nextIndex]);
            Question nextQuestion = questionRepository.findById(nextQuestionId)
                    .orElseThrow(() -> new IllegalStateException("Question not found: " + nextQuestionId));

            session.setCurrentQuestionIndex(nextIndex);
            gameSessionRepository.save(session);

            log.info("Advancing to question {} of {}", nextIndex + 1, QUESTIONS_PER_GAME);
            return Optional.of(buildQuestionPayload(session, nextQuestion, nextIndex + 1, "ROUND1"));
        }

        log.info("Waiting for partner to answer question {}", questionId);
        return Optional.empty();
    }

    public boolean areBothPlayersAnswered(UUID sessionId, Integer questionId) {
        long count = gameAnswerRepository.countByGameSession_IdAndQuestion_Id(sessionId, questionId);
        return count >= 2;
    }

    public GameSession getGameSession(UUID sessionId) {
        return gameSessionRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Game session not found: " + sessionId));
    }

    @Transactional
    public QuestionPayloadDto getFirstRound2Question(UUID sessionId) {
        log.info("Starting Round 2 for session {}", sessionId);
        
        GameSession session = getGameSession(sessionId);
        String[] questionIdsArray = session.getQuestionIds().split(",");
        Integer firstQuestionId = Integer.parseInt(questionIdsArray[0].trim());
        Question firstQuestion = questionRepository.findById(firstQuestionId)
                .orElseThrow(() -> new IllegalStateException("Question not found: " + firstQuestionId));
        
        session.setCurrentQuestionIndex(0);
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
        int currentIndex = session.getCurrentQuestionIndex();
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
        session.setCompletedAt(new Date());
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
