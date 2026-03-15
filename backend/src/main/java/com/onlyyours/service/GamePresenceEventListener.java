package com.onlyyours.service;

import com.onlyyours.dto.GameStatusDto;
import com.onlyyours.model.GameSession;
import com.onlyyours.model.User;
import com.onlyyours.repository.UserRepository;
import jakarta.annotation.PreDestroy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.security.Principal;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.*;

@Component
@RequiredArgsConstructor
@Slf4j
public class GamePresenceEventListener {

    private static final long DISCONNECT_GRACE_PERIOD_MS = 3000;

    private final UserRepository userRepository;
    private final GameService gameService;
    private final SimpMessagingTemplate messagingTemplate;
    private final ConcurrentMap<String, Set<String>> activeSocketSessionsByUser = new ConcurrentHashMap<>();
    private final ConcurrentMap<String, ScheduledFuture<?>> pendingDisconnectsByUser = new ConcurrentHashMap<>();
    private final ScheduledExecutorService disconnectScheduler = Executors.newSingleThreadScheduledExecutor();

    @EventListener
    public void handleSessionConnected(SessionConnectedEvent event) {
        handlePresenceConnected(event.getUser(), resolveSessionId(event));
    }

    @EventListener
    public void handleSessionDisconnected(SessionDisconnectEvent event) {
        handlePresenceDisconnected(event.getUser(), resolveSessionId(event));
    }

    private void handlePresenceConnected(Principal principal, String sessionId) {
        String email = resolvePrincipalEmail(principal);
        if (email == null || sessionId == null) {
            return;
        }

        boolean reconnectingWithinGracePeriod = cancelPendingDisconnect(email);

        boolean shouldEmitReturned = activeSocketSessionsByUser.compute(email, (key, currentSessions) -> {
            Set<String> sessions = currentSessions == null ? ConcurrentHashMap.newKeySet() : currentSessions;
            sessions.add(sessionId);
            return sessions;
        }).size() == 1 && !reconnectingWithinGracePeriod;

        if (shouldEmitReturned) {
            emitPartnerPresenceStatus(email, false);
        }
    }

    private void handlePresenceDisconnected(Principal principal, String sessionId) {
        String email = resolvePrincipalEmail(principal);
        if (email == null || sessionId == null) {
            return;
        }

        boolean stillOnline = activeSocketSessionsByUser.compute(email, (key, currentSessions) -> {
            if (currentSessions == null) {
                return null;
            }

            currentSessions.remove(sessionId);
            if (currentSessions.isEmpty()) {
                return null;
            }
            return currentSessions;
        }) != null;

        if (stillOnline) {
            return;
        }

        cancelPendingDisconnect(email);
        ScheduledFuture<?> scheduledFuture = disconnectScheduler.schedule(
                () -> emitPartnerLeftIfStillOffline(email),
                DISCONNECT_GRACE_PERIOD_MS,
                TimeUnit.MILLISECONDS
        );
        pendingDisconnectsByUser.put(email, scheduledFuture);
    }

    private void emitPartnerLeftIfStillOffline(String userEmail) {
        pendingDisconnectsByUser.remove(userEmail);
        if (activeSocketSessionsByUser.containsKey(userEmail)) {
            return;
        }

        emitPartnerPresenceStatus(userEmail, true);
    }

    private boolean cancelPendingDisconnect(String userEmail) {
        ScheduledFuture<?> pendingDisconnect = pendingDisconnectsByUser.remove(userEmail);
        if (pendingDisconnect != null) {
            pendingDisconnect.cancel(false);
            return true;
        }
        return false;
    }

    private String resolvePrincipalEmail(Principal principal) {
        if (principal == null || principal.getName() == null || principal.getName().isBlank()) {
            return null;
        }
        return principal.getName();
    }

    private String resolveSessionId(Object event) {
        if (event instanceof SessionConnectedEvent connectedEvent) {
            return SimpMessageHeaderAccessor.wrap(connectedEvent.getMessage()).getSessionId();
        }
        SessionDisconnectEvent disconnectEvent = (SessionDisconnectEvent) event;
        return SimpMessageHeaderAccessor.wrap(disconnectEvent.getMessage()).getSessionId();
    }

    @PreDestroy
    void shutdownScheduler() {
        disconnectScheduler.shutdownNow();
    }

    private void emitPartnerPresenceStatus(String userEmail, boolean partnerLeft) {
        if (userEmail == null || userEmail.isBlank()) {
            return;
        }

        Optional<User> userOptional = userRepository.findByEmail(userEmail);
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
