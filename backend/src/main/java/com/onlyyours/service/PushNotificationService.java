package com.onlyyours.service;

import com.onlyyours.model.PushToken;
import com.onlyyours.model.User;
import com.onlyyours.repository.PushTokenRepository;
import com.onlyyours.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@Slf4j
public class PushNotificationService {

    private static final String EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

    private final PushTokenRepository pushTokenRepository;
    private final UserRepository userRepository;
    private final RestClient restClient;

    public PushNotificationService(PushTokenRepository pushTokenRepository,
                                   UserRepository userRepository) {
        this.pushTokenRepository = pushTokenRepository;
        this.userRepository = userRepository;
        this.restClient = RestClient.builder()
                .baseUrl(EXPO_PUSH_URL)
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .defaultHeader(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE)
                .build();
    }

    @Transactional
    public void registerToken(UUID userId, String token, String deviceId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        pushTokenRepository.findByToken(token).ifPresentOrElse(
                existing -> {
                    existing.setUser(user);
                    existing.setDeviceId(deviceId);
                    pushTokenRepository.save(existing);
                    log.info("Push token updated for userId={}", userId);
                },
                () -> {
                    PushToken pt = new PushToken();
                    pt.setUser(user);
                    pt.setToken(token);
                    pt.setDeviceId(deviceId);
                    pushTokenRepository.save(pt);
                    log.info("Push token registered for userId={}", userId);
                }
        );
    }

    @Transactional
    public void unregisterToken(String token) {
        pushTokenRepository.deleteByToken(token);
    }

    public void sendToUser(UUID userId, String title, String body) {
        sendToUser(userId, title, body, null);
    }

    public void sendToUser(UUID userId, String title, String body, Map<String, Object> data) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            log.warn("Cannot send push: user {} not found", userId);
            return;
        }

        List<PushToken> tokens = pushTokenRepository.findByUser(user);
        if (tokens.isEmpty()) {
            log.debug("No push tokens for userId={}, skipping notification", userId);
            return;
        }

        for (PushToken pt : tokens) {
            sendSingle(pt.getToken(), title, body, data);
        }
    }

    private void sendSingle(String pushToken, String title, String body,
                            Map<String, Object> data) {
        Map<String, Object> payload = new java.util.LinkedHashMap<>();
        payload.put("to", pushToken);
        payload.put("title", title);
        payload.put("body", body);
        payload.put("sound", "default");
        if (data != null && !data.isEmpty()) {
            payload.put("data", data);
        }

        try {
            restClient.post()
                    .body(payload)
                    .retrieve()
                    .toBodilessEntity();
            log.debug("Push sent to token={}", pushToken.substring(0, Math.min(20, pushToken.length())));
        } catch (Exception e) {
            log.error("Failed to send push notification: {}", e.getMessage());
        }
    }
}
