package com.onlyyours.service;

import com.onlyyours.dto.GameStatusDto;
import com.onlyyours.model.GameSession;
import com.onlyyours.model.User;
import com.onlyyours.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.security.Principal;
import java.util.Optional;

@Component
@RequiredArgsConstructor
@Slf4j
public class GamePresenceEventListener {

    private final UserRepository userRepository;
    private final GameService gameService;
    private final SimpMessagingTemplate messagingTemplate;

    @EventListener
    public void handleSessionConnected(SessionConnectedEvent event) {
        emitPartnerPresenceStatus(event.getUser(), false);
    }

    @EventListener
    public void handleSessionDisconnected(SessionDisconnectEvent event) {
        emitPartnerPresenceStatus(event.getUser(), true);
    }

    private void emitPartnerPresenceStatus(Principal principal, boolean partnerLeft) {
        if (principal == null || principal.getName() == null || principal.getName().isBlank()) {
            return;
        }

        Optional<User> userOptional = userRepository.findByEmail(principal.getName());
        if (userOptional.isEmpty()) {
            return;
        }

        User user = userOptional.get();
        Optional<GameSession> activeSessionOptional = gameService.getLatestActiveSessionForUser(user.getId());
        if (activeSessionOptional.isEmpty()) {
            return;
        }

        GameSession session = activeSessionOptional.get();
        User partner = session.getCouple().getUser1().getId().equals(user.getId())
                ? session.getCouple().getUser2()
                : session.getCouple().getUser1();

        if (partner == null || partner.getEmail() == null || partner.getEmail().isBlank()) {
            return;
        }

        String status = partnerLeft ? "PARTNER_LEFT" : "PARTNER_RETURNED";
        String message = partnerLeft
                ? user.getName() + " left the game. You can continue when they return."
                : user.getName() + " returned to the game.";

        messagingTemplate.convertAndSendToUser(
                partner.getEmail(),
                "/queue/game-events",
                GameStatusDto.builder()
                        .sessionId(session.getId())
                        .status(status)
                        .message(message)
                        .eventType(status)
                        .timestamp(System.currentTimeMillis())
                        .build()
        );

        log.info("Presence event emitted: status={}, session={}, to={}", status, session.getId(), partner.getEmail());
    }
}
