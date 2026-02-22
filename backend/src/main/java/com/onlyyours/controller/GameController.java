package com.onlyyours.controller;

import com.onlyyours.dto.*;
import com.onlyyours.model.Couple;
import com.onlyyours.model.GameSession;
import com.onlyyours.model.User;
import com.onlyyours.repository.CoupleRepository;
import com.onlyyours.repository.UserRepository;
import com.onlyyours.service.GameService;
import com.onlyyours.service.PushNotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.security.Principal;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

/**
 * WebSocket controller for real-time game interactions.
 * 
 * Handles STOMP messages on /app/* destinations and sends responses to:
 * - Private user queues: /user/queue/* (one player)
 * - Game topics: /topic/game/{sessionId} (both players)
 * 
 * Authentication is handled by WebSocketSecurityConfig which validates JWT
 * and sets Principal on the STOMP session.
 * 
 * @author Sprint 4 Team
 */
@Controller
@Slf4j
@RequiredArgsConstructor
public class GameController {

    private final GameService gameService;
    private final SimpMessagingTemplate messagingTemplate;
    private final UserRepository userRepository;
    private final CoupleRepository coupleRepository;
    private final PushNotificationService pushNotificationService;

    /**
     * Handles game invitation requests.
     * 
     * Message destination: /app/game.invite
     * Expected payload: { "categoryId": "uuid-string" }
     * 
     * Flow:
     * 1. Extract inviter from authenticated principal
     * 2. Create invitation via GameService
     * 3. Send invitation to partner's private queue
     * 4. Send confirmation to inviter
     * 
     * @param payload Map containing categoryId
     * @param principal Authenticated user (from JWT)
     */
    @MessageMapping("/game.invite")
    public void handleInvitation(@Payload Map<String, String> payload, Principal principal) {
        try {
            String categoryIdStr = payload.get("categoryId");
            Integer categoryId = Integer.parseInt(categoryIdStr);

            // Get inviter user from principal
            String inviterEmail = principal.getName();
            User inviter = userRepository.findByEmail(inviterEmail)
                    .orElseThrow(() -> new IllegalArgumentException("User not found: " + inviterEmail));

            // Create invitation
            GameInvitationDto invitation = gameService.createInvitation(inviter.getId(), categoryId);

            // Get partner
            Couple couple = coupleRepository.findByUser1_IdOrUser2_Id(inviter.getId(), inviter.getId())
                    .orElseThrow(() -> new IllegalStateException("User not in a couple"));

            User partner = couple.getUser1().getId().equals(inviter.getId()) 
                    ? couple.getUser2() 
                    : couple.getUser1();

            // Send confirmation to inviter
            messagingTemplate.convertAndSendToUser(
                    inviterEmail,
                    "/queue/game-events",
                    GameStatusDto.builder()
                            .sessionId(invitation.getSessionId())
                            .status("INVITATION_SENT")
                            .message("Invitation sent to " + partner.getName())
                            .build()
            );

            // Send invitation to partner's private queue after inviter is subscribed
            messagingTemplate.convertAndSendToUser(
                    partner.getEmail(),
                    "/queue/game-events",
                    invitation
            );

            pushNotificationService.sendToUser(
                    partner.getId(),
                    "Game Invitation",
                    inviter.getName() + " wants to play with you!",
                    Map.of("type", "INVITATION", "sessionId", invitation.getSessionId().toString())
            );

            log.info("Invitation sent: session={}, inviter={}, invitee={}", 
                    invitation.getSessionId(), inviterEmail, partner.getEmail());

        } catch (Exception e) {
            log.error("Error handling invitation from {}: {}", principal.getName(), e.getMessage(), e);
            sendErrorToUser(principal.getName(), "Failed to send invitation: " + e.getMessage());
        }
    }

    /**
     * Handles game acceptance.
     * 
     * Message destination: /app/game.accept
     * Expected payload: { "sessionId": "uuid-string" }
     * 
     * Flow:
     * 1. Accept invitation via GameService
     * 2. Receive first question
     * 3. Broadcast first question to both players on game topic
     * 
     * @param payload Map containing sessionId
     * @param principal Authenticated user (accepter)
     */
    @MessageMapping("/game.accept")
    public void handleAcceptance(@Payload Map<String, String> payload, Principal principal) {
        try {
            String sessionIdStr = payload.get("sessionId");
            UUID sessionId = UUID.fromString(sessionIdStr);

            // Get accepter user
            String accepterEmail = principal.getName();
            User accepter = userRepository.findByEmail(accepterEmail)
                    .orElseThrow(() -> new IllegalArgumentException("User not found: " + accepterEmail));

            // Accept invitation and get first question
            QuestionPayloadDto firstQuestion = gameService.acceptInvitation(sessionId, accepter.getId());

            GameSession session = gameService.getGameSession(sessionId);
            Couple couple = session.getCouple();
            User inviter = couple.getUser1().getId().equals(accepter.getId())
                    ? couple.getUser2()
                    : couple.getUser1();

            messagingTemplate.convertAndSendToUser(
                    inviter.getEmail(),
                    "/queue/game-events",
                    GameStatusDto.builder()
                            .sessionId(sessionId)
                            .status("INVITATION_ACCEPTED")
                            .message(accepter.getName() + " accepted your invitation")
                            .build()
            );

            // Send first question directly as private fallback in case a client
            // misses the initial topic broadcast during rapid subscribe transitions.
            messagingTemplate.convertAndSendToUser(
                    inviter.getEmail(),
                    "/queue/game-events",
                    firstQuestion
            );
            messagingTemplate.convertAndSendToUser(
                    accepterEmail,
                    "/queue/game-events",
                    firstQuestion
            );

            // Broadcast first question to both players on game topic
            String gameTopic = "/topic/game/" + sessionId;
            messagingTemplate.convertAndSend(gameTopic, firstQuestion);

            log.info("Game started: session={}, accepter={}, question={}", 
                    sessionId, accepterEmail, firstQuestion.getQuestionNumber());

        } catch (Exception e) {
            log.error("Error accepting invitation by {}: {}", principal.getName(), e.getMessage(), e);
            sendErrorToUser(principal.getName(), "Failed to accept game: " + e.getMessage());
        }
    }

    /**
     * Handles game decline.
     * 
     * Message destination: /app/game.decline
     * Expected payload: { "sessionId": "uuid-string" }
     * 
     * Flow:
     * 1. Decline invitation via GameService
     * 2. Notify inviter of decline
     * 
     * @param payload Map containing sessionId
     * @param principal Authenticated user (decliner)
     */
    @MessageMapping("/game.decline")
    public void handleDecline(@Payload Map<String, String> payload, Principal principal) {
        try {
            String sessionIdStr = payload.get("sessionId");
            UUID sessionId = UUID.fromString(sessionIdStr);

            // Get decliner user
            String declinerEmail = principal.getName();
            User decliner = userRepository.findByEmail(declinerEmail)
                    .orElseThrow(() -> new IllegalArgumentException("User not found: " + declinerEmail));

            // Decline invitation
            gameService.declineInvitation(sessionId, decliner.getId());

            // Notify inviter
            Couple couple = coupleRepository.findByUser1_IdOrUser2_Id(decliner.getId(), decliner.getId())
                    .orElseThrow(() -> new IllegalStateException("User not in a couple"));

            User partner = couple.getUser1().getId().equals(decliner.getId()) 
                    ? couple.getUser2() 
                    : couple.getUser1();

            messagingTemplate.convertAndSendToUser(
                    partner.getEmail(),
                    "/queue/game-events",
                    GameStatusDto.builder()
                            .sessionId(sessionId)
                            .status("INVITATION_DECLINED")
                            .message(decliner.getName() + " declined the invitation")
                            .build()
            );

            pushNotificationService.sendToUser(
                    partner.getId(),
                    "Invitation Declined",
                    decliner.getName() + " declined the game invitation"
            );

            log.info("Game declined: session={}, decliner={}", sessionId, declinerEmail);

        } catch (Exception e) {
            log.error("Error declining invitation by {}: {}", principal.getName(), e.getMessage(), e);
            sendErrorToUser(principal.getName(), "Failed to decline: " + e.getMessage());
        }
    }

    /**
     * Handles answer submission.
     * 
     * Message destination: /app/game.answer
     * Expected payload: { "sessionId": "uuid", "questionId": 42, "answer": "B" }
     * 
     * Flow:
     * 1. Submit answer via GameService
     * 2. Send confirmation to this player
     * 3. If both players answered:
     *    a. If next question exists: broadcast it to both players
     *    b. If Round 1 complete: broadcast completion status
     * 
     * @param request AnswerRequestDto with sessionId, questionId, answer
     * @param principal Authenticated user (player submitting answer)
     */
    @MessageMapping("/game.answer")
    public void handleAnswer(@Payload AnswerRequestDto request, Principal principal) {
        try {
            // Get user
            String userEmail = principal.getName();
            User user = userRepository.findByEmail(userEmail)
                    .orElseThrow(() -> new IllegalArgumentException("User not found: " + userEmail));

            // Submit answer
            Optional<QuestionPayloadDto> nextQuestion = gameService.submitAnswer(
                    request.getSessionId(),
                    user.getId(),
                    request.getQuestionId(),
                    request.getAnswer()
            );

            // Send confirmation to this player
            messagingTemplate.convertAndSendToUser(
                    userEmail,
                    "/queue/game-status",
                    GameStatusDto.builder()
                            .sessionId(request.getSessionId())
                            .status("ANSWER_RECORDED")
                            .message("Waiting for partner...")
                            .build()
            );

            // If both answered, broadcast next question or completion status
            if (nextQuestion.isPresent()) {
                // Both answered and there's a next question
                String gameTopic = "/topic/game/" + request.getSessionId();
                messagingTemplate.convertAndSend(gameTopic, nextQuestion.get());

                log.info("Next question broadcasted: session={}, question={}", 
                        request.getSessionId(), nextQuestion.get().getQuestionNumber());
                        
            } else {
                // Check if Round 1 is complete (no next question returned)
                GameSession session = gameService.getGameSession(request.getSessionId());
                
                if (session.getStatus() == GameSession.GameStatus.ROUND2) {
                    String gameTopic = "/topic/game/" + request.getSessionId();

                    messagingTemplate.convertAndSend(
                            gameTopic,
                            GameStatusDto.builder()
                                    .sessionId(request.getSessionId())
                                    .status("ROUND1_COMPLETE")
                                    .message("Round 1 complete! Now guess your partner's answers...")
                                    .build()
                    );
                    log.info("Round 1 complete: session={}", request.getSessionId());

                    QuestionPayloadDto firstRound2Q =
                            gameService.getFirstRound2Question(request.getSessionId());
                    messagingTemplate.convertAndSend(gameTopic, firstRound2Q);
                    log.info("Round 2 started: session={}, first question broadcasted",
                            request.getSessionId());
                }
                // Else: only one player answered, waiting for partner (already sent confirmation above)
            }

        } catch (Exception e) {
            log.error("Error handling answer from {}: {}", principal.getName(), e.getMessage(), e);
            sendErrorToUser(principal.getName(), "Failed to submit answer: " + e.getMessage());
        }
    }

    /**
     * Handles guess submission during Round 2.
     *
     * Message destination: /app/game.guess
     * Expected payload: { "sessionId": "uuid", "questionId": 42, "guess": "B" }
     *
     * Flow:
     * 1. Submit guess via GameService → receive correctness feedback
     * 2. Send private GUESS_RESULT to this player
     * 3. If both players guessed:
     *    a. Next question exists → broadcast it
     *    b. Last question → calculate scores, broadcast GAME_RESULTS
     */
    @MessageMapping("/game.guess")
    public void handleGuess(@Payload GuessRequestDto request, Principal principal) {
        try {
            String userEmail = principal.getName();
            User user = userRepository.findByEmail(userEmail)
                    .orElseThrow(() -> new IllegalArgumentException("User not found: " + userEmail));

            GuessResultDto result = gameService.submitGuess(
                    request.getSessionId(),
                    user.getId(),
                    request.getQuestionId(),
                    request.getGuess()
            );

            messagingTemplate.convertAndSendToUser(
                    userEmail,
                    "/queue/game-events",
                    result
            );

            if (gameService.areBothPlayersGuessed(request.getSessionId(), request.getQuestionId())) {
                Optional<QuestionPayloadDto> nextQuestion =
                        gameService.getNextRound2Question(request.getSessionId());

                String gameTopic = "/topic/game/" + request.getSessionId();

                if (nextQuestion.isPresent()) {
                    messagingTemplate.convertAndSend(gameTopic, nextQuestion.get());
                    log.info("Round 2 next question broadcasted: session={}, question={}",
                            request.getSessionId(), nextQuestion.get().getQuestionNumber());
                } else {
                    GameResultsDto results =
                            gameService.calculateAndCompleteGame(request.getSessionId());
                    messagingTemplate.convertAndSend(gameTopic, results);
                    log.info("Game completed: session={}, p1={}, p2={}",
                            request.getSessionId(), results.getPlayer1Score(),
                            results.getPlayer2Score());
                }
            }

        } catch (Exception e) {
            log.error("Error handling guess from {}: {}", principal.getName(), e.getMessage(), e);
            sendErrorToUser(principal.getName(), "Failed to submit guess: " + e.getMessage());
        }
    }

    private void sendErrorToUser(String userEmail, String errorMessage) {
        messagingTemplate.convertAndSendToUser(
                userEmail,
                "/queue/errors",
                Map.of(
                        "type", "ERROR",
                        "message", errorMessage,
                        "timestamp", System.currentTimeMillis()
                )
        );
    }
}
