package com.onlyyours.controller;

import com.onlyyours.dto.CustomQuestionDeckSummaryDto;
import com.onlyyours.dto.CustomQuestionDto;
import com.onlyyours.dto.CustomQuestionRequestDto;
import com.onlyyours.dto.MessageResponseDto;
import com.onlyyours.model.User;
import com.onlyyours.repository.UserRepository;
import com.onlyyours.service.CustomQuestionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/custom-questions")
@RequiredArgsConstructor
public class CustomQuestionController {

    private final CustomQuestionService customQuestionService;
    private final UserRepository userRepository;

    @GetMapping("/mine")
    public ResponseEntity<?> getMyQuestions(Principal principal) {
        try {
            User currentUser = resolveCurrentUser(principal);
            List<CustomQuestionDto> questions = customQuestionService.getMyQuestions(currentUser.getId());
            return ResponseEntity.ok(questions);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error("CUSTOM_QUESTIONS_USER_NOT_FOUND", e.getMessage()));
        }
    }

    @GetMapping("/summary")
    public ResponseEntity<?> getDeckSummary(Principal principal) {
        try {
            User currentUser = resolveCurrentUser(principal);
            CustomQuestionDeckSummaryDto summary = customQuestionService.getDeckSummary(currentUser.getId());
            return ResponseEntity.ok(summary);
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(error("CUSTOM_QUESTIONS_LINK_REQUIRED", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error("CUSTOM_QUESTIONS_USER_NOT_FOUND", e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<?> createQuestion(@RequestBody CustomQuestionRequestDto request, Principal principal) {
        try {
            User currentUser = resolveCurrentUser(principal);
            CustomQuestionDto created = customQuestionService.createQuestion(currentUser.getId(), request);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(error("CUSTOM_QUESTION_CONFLICT", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(error("CUSTOM_QUESTION_INVALID", e.getMessage()));
        }
    }

    @PutMapping("/{questionId}")
    public ResponseEntity<?> updateQuestion(
            @PathVariable Integer questionId,
            @RequestBody CustomQuestionRequestDto request,
            Principal principal
    ) {
        try {
            User currentUser = resolveCurrentUser(principal);
            CustomQuestionDto updated = customQuestionService.updateQuestion(currentUser.getId(), questionId, request);
            return ResponseEntity.ok(updated);
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(error("CUSTOM_QUESTION_CONFLICT", e.getMessage()));
        } catch (IllegalArgumentException e) {
            String code = "Custom question not found.".equals(e.getMessage())
                    ? "CUSTOM_QUESTION_NOT_FOUND"
                    : "CUSTOM_QUESTION_INVALID";
            HttpStatus status = "Custom question not found.".equals(e.getMessage())
                    ? HttpStatus.NOT_FOUND
                    : HttpStatus.BAD_REQUEST;
            return ResponseEntity.status(status).body(error(code, e.getMessage()));
        }
    }

    @DeleteMapping("/{questionId}")
    public ResponseEntity<?> deleteQuestion(@PathVariable Integer questionId, Principal principal) {
        try {
            User currentUser = resolveCurrentUser(principal);
            customQuestionService.deleteQuestion(currentUser.getId(), questionId);
            return ResponseEntity.ok(new MessageResponseDto("Custom question deleted."));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(error("CUSTOM_QUESTION_CONFLICT", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error("CUSTOM_QUESTION_NOT_FOUND", e.getMessage()));
        }
    }

    private User resolveCurrentUser(Principal principal) {
        return userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + principal.getName()));
    }

    private Map<String, String> error(String code, String message) {
        return Map.of(
                "code", code,
                "message", message
        );
    }
}
