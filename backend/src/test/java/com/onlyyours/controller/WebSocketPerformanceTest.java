package com.onlyyours.controller;

import com.onlyyours.model.*;
import com.onlyyours.repository.*;
import com.onlyyours.service.JwtService;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.messaging.converter.MappingJackson2MessageConverter;
import org.springframework.messaging.simp.stomp.*;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.socket.WebSocketHttpHeaders;
import org.springframework.web.socket.client.standard.StandardWebSocketClient;
import org.springframework.web.socket.messaging.WebSocketStompClient;
import org.springframework.web.socket.sockjs.client.SockJsClient;
import org.springframework.web.socket.sockjs.client.WebSocketTransport;

import java.lang.reflect.Type;
import java.util.*;
import java.util.concurrent.*;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class WebSocketPerformanceTest {

    @LocalServerPort private int port;
    @Autowired private JwtService jwtService;
    @Autowired private UserRepository userRepo;
    @Autowired private CoupleRepository coupleRepo;
    @Autowired private QuestionCategoryRepository categoryRepo;
    @Autowired private QuestionRepository questionRepo;

    private User player1, player2;
    private QuestionCategory category;
    private String token1, token2;
    private WebSocketStompClient stompClient;

    @BeforeAll
    void globalSetUp() {
        stompClient = new WebSocketStompClient(
                new SockJsClient(List.of(new WebSocketTransport(new StandardWebSocketClient()))));
        stompClient.setMessageConverter(new MappingJackson2MessageConverter());

        player1 = new User();
        player1.setEmail("perf-p1@test.com");
        player1.setName("PerfPlayer1");
        player1.setGoogleUserId("google-perf-p1");
        player1 = userRepo.save(player1);

        player2 = new User();
        player2.setEmail("perf-p2@test.com");
        player2.setName("PerfPlayer2");
        player2.setGoogleUserId("google-perf-p2");
        player2 = userRepo.save(player2);

        Couple couple = new Couple();
        couple.setUser1(player1);
        couple.setUser2(player2);
        coupleRepo.save(couple);

        category = new QuestionCategory();
        category.setName("Perf Test Cat");
        category.setDescription("Performance testing");
        category.setSensitive(false);
        category = categoryRepo.save(category);

        for (int i = 1; i <= 10; i++) {
            Question q = new Question();
            q.setCategory(category);
            q.setText("Perf Q" + i);
            q.setOptionA("A"); q.setOptionB("B");
            q.setOptionC("C"); q.setOptionD("D");
            questionRepo.save(q);
        }

        UserDetails ud1 = new org.springframework.security.core.userdetails.User(
                player1.getEmail(), "", Collections.emptyList());
        token1 = jwtService.generateToken(ud1);

        UserDetails ud2 = new org.springframework.security.core.userdetails.User(
                player2.getEmail(), "", Collections.emptyList());
        token2 = jwtService.generateToken(ud2);
    }

    private StompSession connect(String token) throws Exception {
        StompHeaders headers = new StompHeaders();
        headers.add("Authorization", "Bearer " + token);
        return stompClient.connectAsync(
                "ws://localhost:" + port + "/ws",
                new WebSocketHttpHeaders(), headers,
                new StompSessionHandlerAdapter() {})
                .get(5, TimeUnit.SECONDS);
    }

    @Test
    void testConnectionLatency() throws Exception {
        long start = System.nanoTime();
        StompSession session = connect(token1);
        long elapsed = TimeUnit.NANOSECONDS.toMillis(System.nanoTime() - start);

        assertTrue(session.isConnected());
        System.out.println("[PERF] STOMP connection time: " + elapsed + "ms");
        assertTrue(elapsed < 5000, "Connection should complete within 5 seconds");

        session.disconnect();
    }

    @Test
    void testInvitationRoundTripLatency() throws Exception {
        StompSession s1 = connect(token1);
        StompSession s2 = connect(token2);

        BlockingQueue<Map> received = new LinkedBlockingQueue<>();
        s2.subscribe("/user/queue/game-events", new StompFrameHandler() {
            @Override public Type getPayloadType(StompHeaders h) { return Map.class; }
            @Override public void handleFrame(StompHeaders h, Object p) { received.add((Map) p); }
        });

        Thread.sleep(500);

        long start = System.nanoTime();
        s1.send("/app/game.invite", Map.of("categoryId", String.valueOf(category.getId())));
        Map invitation = received.poll(5, TimeUnit.SECONDS);
        long elapsed = TimeUnit.NANOSECONDS.toMillis(System.nanoTime() - start);

        assertNotNull(invitation);
        System.out.println("[PERF] Invitation round-trip latency: " + elapsed + "ms");
        assertTrue(elapsed < 2000, "Invitation should arrive within 2 seconds");

        s1.disconnect();
        s2.disconnect();
    }

    @Test
    void testFullGameCompletionTime() throws Exception {
        StompSession s1 = connect(token1);
        StompSession s2 = connect(token2);

        BlockingQueue<Map> p2Events = new LinkedBlockingQueue<>();
        BlockingQueue<Map> p1GameTopic = new LinkedBlockingQueue<>();

        s2.subscribe("/user/queue/game-events", new StompFrameHandler() {
            @Override public Type getPayloadType(StompHeaders h) { return Map.class; }
            @Override public void handleFrame(StompHeaders h, Object p) { p2Events.add((Map) p); }
        });

        Thread.sleep(500);

        long gameStart = System.nanoTime();

        s1.send("/app/game.invite", Map.of("categoryId", String.valueOf(category.getId())));
        Map invitation = p2Events.poll(5, TimeUnit.SECONDS);
        assertNotNull(invitation, "Should receive invitation");
        String sessionId = invitation.get("sessionId").toString();

        s1.subscribe("/topic/game/" + sessionId, new StompFrameHandler() {
            @Override public Type getPayloadType(StompHeaders h) { return Map.class; }
            @Override public void handleFrame(StompHeaders h, Object p) { p1GameTopic.add((Map) p); }
        });

        Thread.sleep(300);

        s2.send("/app/game.accept", Map.of("sessionId", sessionId));

        List<Long> answerLatencies = new ArrayList<>();

        for (int q = 1; q <= 8; q++) {
            Map questionMsg = null;

            while (questionMsg == null) {
                Map msg = p1GameTopic.poll(5, TimeUnit.SECONDS);
                assertNotNull(msg, "Should receive message for question " + q);
                if ("QUESTION".equals(msg.get("type"))) {
                    questionMsg = msg;
                }
            }

            Integer questionId = (Integer) questionMsg.get("questionId");

            long answerStart = System.nanoTime();

            s1.send("/app/game.answer",
                    Map.of("sessionId", sessionId, "questionId", questionId, "answer", "A"));

            Thread.sleep(50);

            s2.send("/app/game.answer",
                    Map.of("sessionId", sessionId, "questionId", questionId, "answer", "B"));

            long answerElapsed = TimeUnit.NANOSECONDS.toMillis(System.nanoTime() - answerStart);
            answerLatencies.add(answerElapsed);

            Thread.sleep(200);
        }

        long totalElapsed = TimeUnit.NANOSECONDS.toMillis(System.nanoTime() - gameStart);

        double avgLatency = answerLatencies.stream().mapToLong(Long::longValue).average().orElse(0);
        long maxLatency = answerLatencies.stream().mapToLong(Long::longValue).max().orElse(0);

        System.out.println("============= PERFORMANCE REPORT =============");
        System.out.println("[PERF] Total game time (8 questions): " + totalElapsed + "ms");
        System.out.println("[PERF] Average answer submission latency: " + String.format("%.1f", avgLatency) + "ms");
        System.out.println("[PERF] Max answer submission latency: " + maxLatency + "ms");
        System.out.println("[PERF] Per-question latencies: " + answerLatencies);

        Runtime runtime = Runtime.getRuntime();
        long usedMemory = (runtime.totalMemory() - runtime.freeMemory()) / (1024 * 1024);
        System.out.println("[PERF] JVM memory used: " + usedMemory + "MB");
        System.out.println("===============================================");

        assertTrue(totalElapsed < 30000, "Full game should complete within 30 seconds");

        s1.disconnect();
        s2.disconnect();
    }
}
