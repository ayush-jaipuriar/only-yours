package com.onlyyours.controller;

import com.onlyyours.model.User;
import com.onlyyours.repository.UserRepository;
import com.onlyyours.service.GameService;
import com.onlyyours.service.SessionExpiredException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/game")
@RequiredArgsConstructor
@Slf4j
public class GameQueryController {

    private final GameService gameService;
    private final UserRepository userRepository;

    @GetMapping("/active")
    public ResponseEntity<?> getActiveGameSession(Principal principal) {
        User user = resolveCurrentUser(principal);

        return gameService.getActiveSessionSummary(user.getId())
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "No active game session")));
    }

    @GetMapping("/history")
    public ResponseEntity<?> getGameHistory(
            @RequestParam(defaultValue = "0") Integer page,
            @RequestParam(defaultValue = "10") Integer size,
            @RequestParam(defaultValue = "recent") String sort,
            @RequestParam(defaultValue = "all") String winner,
            Principal principal
    ) {
        User user = resolveCurrentUser(principal);
        return ResponseEntity.ok(gameService.getGameHistory(user.getId(), page, size, sort, winner));
    }

    @GetMapping("/stats")
    public ResponseEntity<?> getDashboardStats(Principal principal) {
        User user = resolveCurrentUser(principal);
        return ResponseEntity.ok(gameService.getDashboardStats(user.getId()));
    }

    @GetMapping("/badges")
    public ResponseEntity<?> getBadges(Principal principal) {
        User user = resolveCurrentUser(principal);
        return ResponseEntity.ok(Map.of("badges", gameService.getBadges(user.getId())));
    }

    @GetMapping("/{sessionId}/current-question")
    public ResponseEntity<?> getCurrentQuestion(
            @PathVariable UUID sessionId,
            Principal principal
    ) {
        try {
            User user = resolveCurrentUser(principal);

            return gameService.getCurrentQuestionForUser(sessionId, user.getId())
                    .<ResponseEntity<?>>map(ResponseEntity::ok)
                    .orElseGet(() -> ResponseEntity.status(HttpStatus.CONFLICT)
                            .body(Map.of("error", "No current question available for this session state")));
        } catch (SessionExpiredException e) {
            return ResponseEntity.status(HttpStatus.GONE)
                    .body(Map.of(
                            "error", "Game session expired",
                            "sessionId", e.getSessionId().toString()
                    ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        } catch (IllegalStateException e) {
            log.warn("Invalid current-question request for session {}: {}", sessionId, e.getMessage());
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    private User resolveCurrentUser(Principal principal) {
        return userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + principal.getName()));
    }
}
