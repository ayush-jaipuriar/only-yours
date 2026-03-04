package com.onlyyours.service;

import com.onlyyours.model.User;
import com.onlyyours.repository.PushTokenRepository;
import com.onlyyours.repository.UserRepository;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PushNotificationServiceTest {

    @Mock
    private PushTokenRepository pushTokenRepository;

    @Mock
    private UserRepository userRepository;

    private PushNotificationService pushNotificationService;
    private UUID userId;
    private User user;

    @BeforeEach
    void setUp() {
        pushNotificationService = new PushNotificationService(pushTokenRepository, userRepository);
        userId = UUID.randomUUID();

        user = new User();
        user.setId(userId);
        user.setEmail("push@test.com");
        user.setName("Push Tester");

        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(pushTokenRepository.findByUser(user)).thenReturn(List.of());
    }

    @Test
    void sendGameplayEventToUser_DeduplicatesEquivalentEvents() {
        UUID sessionId = UUID.randomUUID();

        pushNotificationService.sendGameplayEventToUser(
                userId,
                PushNotificationService.GameplayEventType.RESULTS_READY,
                sessionId,
                "Results Ready",
                "Your game results are ready."
        );
        pushNotificationService.sendGameplayEventToUser(
                userId,
                PushNotificationService.GameplayEventType.RESULTS_READY,
                sessionId,
                "Results Ready",
                "Your game results are ready."
        );

        verify(pushTokenRepository, times(1)).findByUser(user);
    }

    @Test
    void sendGameplayEventToUser_AllowsDistinctQuestionScopedEvents() {
        UUID sessionId = UUID.randomUUID();

        pushNotificationService.sendGameplayEventToUser(
                userId,
                PushNotificationService.GameplayEventType.PARTNER_COMPLETED_ANSWERING,
                sessionId,
                "Partner Answered",
                "Continue your game.",
                Map.of("questionId", 1)
        );
        pushNotificationService.sendGameplayEventToUser(
                userId,
                PushNotificationService.GameplayEventType.PARTNER_COMPLETED_ANSWERING,
                sessionId,
                "Partner Answered",
                "Continue your game.",
                Map.of("questionId", 2)
        );

        verify(pushTokenRepository, times(2)).findByUser(user);
    }
}
