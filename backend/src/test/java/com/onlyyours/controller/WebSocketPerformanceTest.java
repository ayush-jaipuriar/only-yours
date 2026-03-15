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
    @Autowired private GameSessionRepository gameSessionRepo;
    @Autowired private GameAnswerRepository gameAnswerRepo;

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

    @BeforeEach
    void resetGameState() {
        gameAnswerRepo.deleteAll();
        gameSessionRepo.deleteAll();
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

    private Map awaitMessageOfType(BlockingQueue<Map> queue, String type, long timeoutSeconds) throws Exception {
        long deadline = System.nanoTime() + TimeUnit.SECONDS.toNanos(timeoutSeconds);
        while (System.nanoTime() < deadline) {
            long remainingMillis = TimeUnit.NANOSECONDS.toMillis(deadline - System.nanoTime());
            Map message = queue.poll(Math.max(1L, remainingMillis), TimeUnit.MILLISECONDS);
            if (message == null) {
                break;
            }
            if (type.equals(message.get("type"))) {
                return message;
            }
        }
        return null;
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

        BlockingQueue<Map> p1Events = new LinkedBlockingQueue<>();
        BlockingQueue<Map> p2Events = new LinkedBlockingQueue<>();
        BlockingQueue<Map> gameTopic = new LinkedBlockingQueue<>();

        s1.subscribe("/user/queue/game-events", new StompFrameHandler() {
            @Override public Type getPayloadType(StompHeaders h) { return Map.class; }
            @Override public void handleFrame(StompHeaders h, Object p) { p1Events.add((Map) p); }
        });

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
            @Override public void handleFrame(StompHeaders h, Object p) { gameTopic.add((Map) p); }
        });

        Thread.sleep(300);

        s2.send("/app/game.accept", Map.of("sessionId", sessionId));

        Map p1Question = awaitMessageOfType(p1Events, "QUESTION", 5);
        Map p2Question = awaitMessageOfType(p2Events, "QUESTION", 5);
        assertNotNull(p1Question, "Player 1 should receive the first Round 1 question privately");
        assertNotNull(p2Question, "Player 2 should receive the first Round 1 question privately");

        List<Long> answerLatencies = new ArrayList<>();
        for (int q = 1; q <= 8; q++) {
            long answerStart = System.nanoTime();

            s1.send("/app/game.answer",
                    Map.of("sessionId", sessionId, "questionId", p1Question.get("questionId"), "answer", "A"));

            if (q < 8) {
                p1Question = awaitMessageOfType(p1Events, "QUESTION", 5);
                assertNotNull(p1Question, "Player 1 should receive Round 1 question " + (q + 1));
            } else {
                Map p1Waiting = awaitMessageOfType(p1Events, "ROUND_STATE", 5);
                assertNotNull(p1Waiting, "Player 1 should receive a round-end waiting state after finishing answers");
            }

            s2.send("/app/game.answer",
                    Map.of("sessionId", sessionId, "questionId", p2Question.get("questionId"), "answer", "B"));

            if (q < 8) {
                p2Question = awaitMessageOfType(p2Events, "QUESTION", 5);
                assertNotNull(p2Question, "Player 2 should receive Round 1 question " + (q + 1));
            }

            answerLatencies.add(TimeUnit.NANOSECONDS.toMillis(System.nanoTime() - answerStart));
        }

        Map round1Complete = awaitMessageOfType(gameTopic, "STATUS", 5);
        assertNotNull(round1Complete, "Both players should see the Round 1 completion broadcast");
        assertEquals("ROUND1_COMPLETE", round1Complete.get("eventType"));

        Map round2Question = awaitMessageOfType(gameTopic, "QUESTION", 5);
        assertNotNull(round2Question, "Round 2 should start with a shared topic broadcast");

        Map p1Round2Question = round2Question;
        Map p2Round2Question = round2Question;
        List<Long> guessLatencies = new ArrayList<>();

        for (int q = 1; q <= 8; q++) {
            long guessStart = System.nanoTime();

            s1.send("/app/game.guess",
                    Map.of("sessionId", sessionId, "questionId", p1Round2Question.get("questionId"), "guess", "B"));

            if (q < 8) {
                p1Round2Question = awaitMessageOfType(p1Events, "QUESTION", 5);
                assertNotNull(p1Round2Question, "Player 1 should receive Round 2 question " + (q + 1));
            } else {
                Map p1Waiting = awaitMessageOfType(p1Events, "ROUND_STATE", 5);
                assertNotNull(p1Waiting, "Player 1 should receive a round-end waiting state after finishing guesses");
            }

            s2.send("/app/game.guess",
                    Map.of("sessionId", sessionId, "questionId", p2Round2Question.get("questionId"), "guess", "A"));

            if (q < 8) {
                p2Round2Question = awaitMessageOfType(p2Events, "QUESTION", 5);
                assertNotNull(p2Round2Question, "Player 2 should receive Round 2 question " + (q + 1));
            }

            guessLatencies.add(TimeUnit.NANOSECONDS.toMillis(System.nanoTime() - guessStart));
        }

        Map results = awaitMessageOfType(gameTopic, "GAME_RESULTS", 5);
        assertNotNull(results, "Game should broadcast final results when both players finish guessing");

        long totalElapsed = TimeUnit.NANOSECONDS.toMillis(System.nanoTime() - gameStart);

        double avgAnswerLatency = answerLatencies.stream().mapToLong(Long::longValue).average().orElse(0);
        long maxAnswerLatency = answerLatencies.stream().mapToLong(Long::longValue).max().orElse(0);
        double avgGuessLatency = guessLatencies.stream().mapToLong(Long::longValue).average().orElse(0);
        long maxGuessLatency = guessLatencies.stream().mapToLong(Long::longValue).max().orElse(0);

        System.out.println("============= PERFORMANCE REPORT =============");
        System.out.println("[PERF] Total game time (answers + guesses + results): " + totalElapsed + "ms");
        System.out.println("[PERF] Average answer submission latency: " + String.format("%.1f", avgAnswerLatency) + "ms");
        System.out.println("[PERF] Max answer submission latency: " + maxAnswerLatency + "ms");
        System.out.println("[PERF] Average guess submission latency: " + String.format("%.1f", avgGuessLatency) + "ms");
        System.out.println("[PERF] Max guess submission latency: " + maxGuessLatency + "ms");
        System.out.println("[PERF] Per-question latencies: " + answerLatencies);
        System.out.println("[PERF] Per-guess latencies: " + guessLatencies);

        Runtime runtime = Runtime.getRuntime();
        long usedMemory = (runtime.totalMemory() - runtime.freeMemory()) / (1024 * 1024);
        System.out.println("[PERF] JVM memory used: " + usedMemory + "MB");
        System.out.println("===============================================");

        assertTrue(totalElapsed < 30000, "Full game should complete within 30 seconds");

        s1.disconnect();
        s2.disconnect();
    }
}
