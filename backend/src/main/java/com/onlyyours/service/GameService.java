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

        return buildQuestionPayload(session, selectedQuestions.get(0), 1);
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
            return Optional.of(buildQuestionPayload(session, nextQuestion, nextIndex + 1));
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

    private QuestionPayloadDto buildQuestionPayload(
            GameSession session, 
            Question question, 
            int questionNumber) {
        
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
                .round("ROUND1")
                .build();
    }
}
