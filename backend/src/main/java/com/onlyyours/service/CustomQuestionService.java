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
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CustomQuestionService {

    private final QuestionRepository questionRepository;
    private final UserRepository userRepository;
    private final CoupleRepository coupleRepository;

    @Transactional(readOnly = true)
    public List<CustomQuestionDto> getMyQuestions(UUID userId) {
        resolveCurrentUser(userId);
        return questionRepository.findByCreatedBy_IdAndSourceTypeAndArchivedFalseOrderByUpdatedAtDesc(
                        userId,
                        Question.SourceType.CUSTOM_COUPLE
                ).stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public CustomQuestionDeckSummaryDto getDeckSummary(UUID userId) {
        User currentUser = resolveCurrentUser(userId);
        Couple couple = requireActiveCoupleForUser(userId);

        int authoredCount = questionRepository
                .findByCreatedBy_IdAndSourceTypeAndArchivedFalseOrderByUpdatedAtDesc(
                        currentUser.getId(),
                        Question.SourceType.CUSTOM_COUPLE
                )
                .size();
        int coupleCount = (int) questionRepository.countByCouple_IdAndSourceTypeAndArchivedFalse(
                couple.getId(),
                Question.SourceType.CUSTOM_COUPLE
        );
        int questionsNeeded = Math.max(0, CustomQuestionDeckMetadata.MINIMUM_PLAYABLE_QUESTIONS - coupleCount);

        return CustomQuestionDeckSummaryDto.builder()
                .authoredQuestionCount(authoredCount)
                .couplePlayableQuestionCount(coupleCount)
                .minimumQuestionsRequired(CustomQuestionDeckMetadata.MINIMUM_PLAYABLE_QUESTIONS)
                .questionsNeededToPlay(questionsNeeded)
                .playable(questionsNeeded == 0)
                .linked(Boolean.TRUE)
                .deckName(CustomQuestionDeckMetadata.DECK_NAME)
                .deckDescription(CustomQuestionDeckMetadata.DECK_DESCRIPTION)
                .build();
    }

    @Transactional
    public CustomQuestionDto createQuestion(UUID userId, CustomQuestionRequestDto request) {
        User currentUser = resolveCurrentUser(userId);
        Couple couple = requireActiveCoupleForUser(userId);

        SanitizedQuestion sanitized = sanitize(request);
        ensureNoDuplicateQuestion(couple.getId(), sanitized.normalizedQuestionText, null);

        Question question = new Question();
        question.setSourceType(Question.SourceType.CUSTOM_COUPLE);
        question.setCouple(couple);
        question.setCreatedBy(currentUser);
        question.setText(sanitized.questionText);
        question.setOptionA(sanitized.optionA);
        question.setOptionB(sanitized.optionB);
        question.setOptionC(sanitized.optionC);
        question.setOptionD(sanitized.optionD);
        question.setArchived(false);

        return toDto(questionRepository.save(question));
    }

    @Transactional
    public CustomQuestionDto updateQuestion(UUID userId, Integer questionId, CustomQuestionRequestDto request) {
        resolveCurrentUser(userId);
        Question question = findManageableQuestion(questionId, userId);

        SanitizedQuestion sanitized = sanitize(request);
        ensureNoDuplicateQuestion(question.getCouple().getId(), sanitized.normalizedQuestionText, question.getId());

        question.setText(sanitized.questionText);
        question.setOptionA(sanitized.optionA);
        question.setOptionB(sanitized.optionB);
        question.setOptionC(sanitized.optionC);
        question.setOptionD(sanitized.optionD);

        return toDto(questionRepository.save(question));
    }

    @Transactional
    public void deleteQuestion(UUID userId, Integer questionId) {
        resolveCurrentUser(userId);
        Question question = findManageableQuestion(questionId, userId);
        question.setArchived(true);
        questionRepository.save(question);
    }

    private Question findManageableQuestion(Integer questionId, UUID userId) {
        Question question = questionRepository.findByIdAndSourceType(questionId, Question.SourceType.CUSTOM_COUPLE)
                .orElseThrow(() -> new IllegalArgumentException("Custom question not found."));

        if (question.isArchived()) {
            throw new IllegalArgumentException("Custom question not found.");
        }

        if (question.getCreatedBy() == null || !question.getCreatedBy().getId().equals(userId)) {
            throw new IllegalStateException("You can only manage questions you created.");
        }

        return question;
    }

    private void ensureNoDuplicateQuestion(UUID coupleId, String normalizedQuestionText, Integer excludeQuestionId) {
        boolean duplicateExists = questionRepository
                .findByCouple_IdAndSourceTypeAndArchivedFalse(coupleId, Question.SourceType.CUSTOM_COUPLE)
                .stream()
                .filter(question -> excludeQuestionId == null || !question.getId().equals(excludeQuestionId))
                .map(Question::getText)
                .map(this::normalizeQuestionText)
                .anyMatch(normalizedQuestionText::equals);

        if (duplicateExists) {
            throw new IllegalStateException("This custom question already exists in your couple deck.");
        }
    }

    private SanitizedQuestion sanitize(CustomQuestionRequestDto request) {
        if (request == null) {
            throw new IllegalArgumentException("Question payload is required.");
        }

        String questionText = requireText(request.getQuestionText(), "questionText");
        String optionA = requireText(request.getOptionA(), "optionA");
        String optionB = requireText(request.getOptionB(), "optionB");
        String optionC = requireText(request.getOptionC(), "optionC");
        String optionD = requireText(request.getOptionD(), "optionD");

        return new SanitizedQuestion(
                questionText,
                optionA,
                optionB,
                optionC,
                optionD,
                normalizeQuestionText(questionText)
        );
    }

    private String requireText(String value, String fieldName) {
        String trimmed = value == null ? "" : value.trim();
        if (trimmed.isEmpty()) {
            throw new IllegalArgumentException(fieldName + " is required.");
        }
        return trimmed;
    }

    private String normalizeQuestionText(String value) {
        return value == null
                ? ""
                : value.trim().replaceAll("\\s+", " ").toLowerCase(Locale.ROOT);
    }

    private User resolveCurrentUser(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));
    }

    private Couple requireActiveCoupleForUser(UUID userId) {
        return coupleRepository.findByUserIdAndStatusOrderByCreatedAtDesc(userId, Couple.RelationshipStatus.ACTIVE)
                .stream()
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("You must be linked with a partner to manage custom questions."));
    }

    private CustomQuestionDto toDto(Question question) {
        return CustomQuestionDto.builder()
                .id(question.getId())
                .createdByUserId(question.getCreatedBy() == null ? null : question.getCreatedBy().getId())
                .questionText(question.getText())
                .optionA(question.getOptionA())
                .optionB(question.getOptionB())
                .optionC(question.getOptionC())
                .optionD(question.getOptionD())
                .createdAt(question.getCreatedAt() == null ? null : question.getCreatedAt().getTime())
                .updatedAt(question.getUpdatedAt() == null ? null : question.getUpdatedAt().getTime())
                .build();
    }

    private record SanitizedQuestion(
            String questionText,
            String optionA,
            String optionB,
            String optionC,
            String optionD,
            String normalizedQuestionText
    ) {
    }
}
