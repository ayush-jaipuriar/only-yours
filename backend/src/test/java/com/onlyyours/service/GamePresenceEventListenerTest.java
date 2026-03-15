package com.onlyyours.service;

import com.onlyyours.model.Couple;
import com.onlyyours.model.GameSession;
import com.onlyyours.model.User;
import com.onlyyours.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.Message;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.security.Principal;
import java.util.Optional;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class GamePresenceEventListenerTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private GameService gameService;

    @Mock
    private SimpMessagingTemplate messagingTemplate;

    private GamePresenceEventListener listener;
    private User currentUser;
    private User partnerUser;
    private GameSession activeSession;

    @BeforeEach
    void setUp() {
        listener = new GamePresenceEventListener(userRepository, gameService, messagingTemplate);

        currentUser = new User();
        currentUser.setId(UUID.randomUUID());
        currentUser.setEmail("current@test.com");
        currentUser.setName("Current User");

        partnerUser = new User();
        partnerUser.setId(UUID.randomUUID());
        partnerUser.setEmail("partner@test.com");
        partnerUser.setName("Partner User");

        Couple couple = new Couple();
        couple.setUser1(currentUser);
        couple.setUser2(partnerUser);

        activeSession = new GameSession();
        activeSession.setId(UUID.randomUUID());
        activeSession.setCouple(couple);
        activeSession.setStatus(GameSession.GameStatus.ROUND1);

        when(userRepository.findByEmail(currentUser.getEmail())).thenReturn(Optional.of(currentUser));
        when(gameService.getLatestActiveSessionForUser(currentUser.getId())).thenReturn(Optional.of(activeSession));
    }

    @AfterEach
    void tearDown() {
        listener.shutdownScheduler();
    }

    @Test
    void overlappingReconnectsDoNotEmitFalsePartnerLeft() {
        listener.handleSessionConnected(mockConnectedEvent("session-1"));
        listener.handleSessionConnected(mockConnectedEvent("session-2"));
        listener.handleSessionDisconnected(mockDisconnectEvent("session-1"));

        verify(messagingTemplate, times(1)).convertAndSendToUser(
                eq(partnerUser.getEmail()),
                eq("/queue/game-events"),
                any()
        );
    }

    @Test
    void reconnectWithinGracePeriodDoesNotEmitLeftOrReturnedNoise() throws Exception {
        listener.handleSessionConnected(mockConnectedEvent("session-1"));
        listener.handleSessionDisconnected(mockDisconnectEvent("session-1"));
        listener.handleSessionConnected(mockConnectedEvent("session-2"));

        Thread.sleep(3200);

        verify(messagingTemplate, times(1)).convertAndSendToUser(
                eq(partnerUser.getEmail()),
                eq("/queue/game-events"),
                any()
        );
    }

    @Test
    void finalDisconnectAfterGracePeriodEmitsPartnerLeft() throws Exception {
        listener.handleSessionConnected(mockConnectedEvent("session-1"));
        listener.handleSessionDisconnected(mockDisconnectEvent("session-1"));

        Thread.sleep(3200);

        verify(messagingTemplate, times(2)).convertAndSendToUser(
                eq(partnerUser.getEmail()),
                eq("/queue/game-events"),
                any()
        );
    }

    private SessionConnectedEvent mockConnectedEvent(String sessionId) {
        SessionConnectedEvent event = mock(SessionConnectedEvent.class);
        when(event.getUser()).thenReturn(mockPrincipal());
        when(event.getMessage()).thenReturn(buildMessage(sessionId));
        return event;
    }

    private SessionDisconnectEvent mockDisconnectEvent(String sessionId) {
        SessionDisconnectEvent event = mock(SessionDisconnectEvent.class);
        when(event.getUser()).thenReturn(mockPrincipal());
        when(event.getMessage()).thenReturn(buildMessage(sessionId));
        return event;
    }

    private Principal mockPrincipal() {
        return () -> currentUser.getEmail();
    }

    private Message<byte[]> buildMessage(String sessionId) {
        SimpMessageHeaderAccessor accessor = SimpMessageHeaderAccessor.create();
        accessor.setSessionId(sessionId);
        accessor.setLeaveMutable(true);
        return MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());
    }
}
