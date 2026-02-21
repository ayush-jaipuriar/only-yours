package com.onlyyours.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.onlyyours.dto.GameInvitationDto;
import com.onlyyours.dto.QuestionPayloadDto;
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
class GameControllerWebSocketTest {

    @LocalServerPort private int port;
    @Autowired private JwtService jwtService;
    @Autowired private UserRepository userRepo;
    @Autowired private CoupleRepository coupleRepo;
    @Autowired private QuestionCategoryRepository categoryRepo;
    @Autowired private QuestionRepository questionRepo;
    @Autowired private ObjectMapper objectMapper;

    private User inviter, invitee;
    private QuestionCategory category;
    private String inviterToken, inviteeToken;
    private WebSocketStompClient stompClient;

    @BeforeAll
    void globalSetUp() {
        stompClient = new WebSocketStompClient(
                new SockJsClient(List.of(new WebSocketTransport(new StandardWebSocketClient()))));
        stompClient.setMessageConverter(new MappingJackson2MessageConverter());

        inviter = new User();
        inviter.setEmail("inviter@ws-test.com");
        inviter.setName("Inviter");
        inviter.setGoogleUserId("google-ws-inviter");
        inviter = userRepo.save(inviter);

        invitee = new User();
        invitee.setEmail("invitee@ws-test.com");
        invitee.setName("Invitee");
        invitee.setGoogleUserId("google-ws-invitee");
        invitee = userRepo.save(invitee);

        Couple couple = new Couple();
        couple.setUser1(inviter);
        couple.setUser2(invitee);
        coupleRepo.save(couple);

        category = new QuestionCategory();
        category.setName("WebSocket Test Category");
        category.setDescription("For WS tests");
        category.setSensitive(false);
        category = categoryRepo.save(category);

        for (int i = 1; i <= 10; i++) {
            Question q = new Question();
            q.setCategory(category);
            q.setText("WS Test Question " + i);
            q.setOptionA("A" + i);
            q.setOptionB("B" + i);
            q.setOptionC("C" + i);
            q.setOptionD("D" + i);
            questionRepo.save(q);
        }

        UserDetails inviterDetails = new org.springframework.security.core.userdetails.User(
                inviter.getEmail(), "", Collections.emptyList());
        inviterToken = jwtService.generateToken(inviterDetails);

        UserDetails inviteeDetails = new org.springframework.security.core.userdetails.User(
                invitee.getEmail(), "", Collections.emptyList());
        inviteeToken = jwtService.generateToken(inviteeDetails);
    }

    private StompSession connectWithToken(String token) throws Exception {
        StompHeaders connectHeaders = new StompHeaders();
        connectHeaders.add("Authorization", "Bearer " + token);

        CompletableFuture<StompSession> future = stompClient.connectAsync(
                "ws://localhost:" + port + "/ws",
                new WebSocketHttpHeaders(),
                connectHeaders,
                new StompSessionHandlerAdapter() {});

        return future.get(5, TimeUnit.SECONDS);
    }

    @Test
    void testConnect_WithValidToken_Succeeds() throws Exception {
        StompSession session = connectWithToken(inviterToken);

        assertTrue(session.isConnected());
        session.disconnect();
    }

    @Test
    void testConnect_WithInvalidToken_Fails() {
        assertThrows(Exception.class, () -> connectWithToken("invalid-token"));
    }

    @Test
    void testInvitationFlow_InviteeReceivesInvitation() throws Exception {
        StompSession inviterSession = connectWithToken(inviterToken);
        StompSession inviteeSession = connectWithToken(inviteeToken);

        BlockingQueue<Map> inviteeMessages = new LinkedBlockingQueue<>();

        inviteeSession.subscribe("/user/queue/game-events", new StompFrameHandler() {
            @Override
            public Type getPayloadType(StompHeaders headers) {
                return Map.class;
            }

            @Override
            public void handleFrame(StompHeaders headers, Object payload) {
                inviteeMessages.add((Map) payload);
            }
        });

        Thread.sleep(500);

        inviterSession.send("/app/game.invite",
                Map.of("categoryId", String.valueOf(category.getId())));

        Map invitation = inviteeMessages.poll(5, TimeUnit.SECONDS);
        assertNotNull(invitation, "Invitee should receive invitation");
        assertEquals("INVITATION", invitation.get("type"));
        assertEquals("Inviter", invitation.get("inviterName"));
        assertEquals(category.getName(), invitation.get("categoryName"));

        inviterSession.disconnect();
        inviteeSession.disconnect();
    }

    @Test
    void testAcceptFlow_BothPlayersReceiveFirstQuestion() throws Exception {
        StompSession inviterSession = connectWithToken(inviterToken);
        StompSession inviteeSession = connectWithToken(inviteeToken);

        BlockingQueue<Map> inviterEvents = new LinkedBlockingQueue<>();
        BlockingQueue<Map> inviteeEvents = new LinkedBlockingQueue<>();

        inviteeSession.subscribe("/user/queue/game-events", new StompFrameHandler() {
            @Override
            public Type getPayloadType(StompHeaders headers) { return Map.class; }
            @Override
            public void handleFrame(StompHeaders headers, Object payload) {
                inviteeEvents.add((Map) payload);
            }
        });

        inviterSession.subscribe("/user/queue/game-events", new StompFrameHandler() {
            @Override
            public Type getPayloadType(StompHeaders headers) { return Map.class; }
            @Override
            public void handleFrame(StompHeaders headers, Object payload) {
                inviterEvents.add((Map) payload);
            }
        });

        Thread.sleep(500);

        inviterSession.send("/app/game.invite",
                Map.of("categoryId", String.valueOf(category.getId())));

        Map invitation = inviteeEvents.poll(5, TimeUnit.SECONDS);
        assertNotNull(invitation);
        String sessionId = invitation.get("sessionId").toString();

        BlockingQueue<Map> gameTopicMessages = new LinkedBlockingQueue<>();
        inviterSession.subscribe("/topic/game/" + sessionId, new StompFrameHandler() {
            @Override
            public Type getPayloadType(StompHeaders headers) { return Map.class; }
            @Override
            public void handleFrame(StompHeaders headers, Object payload) {
                gameTopicMessages.add((Map) payload);
            }
        });
        inviteeSession.subscribe("/topic/game/" + sessionId, new StompFrameHandler() {
            @Override
            public Type getPayloadType(StompHeaders headers) { return Map.class; }
            @Override
            public void handleFrame(StompHeaders headers, Object payload) {
                gameTopicMessages.add((Map) payload);
            }
        });

        Thread.sleep(500);

        inviteeSession.send("/app/game.accept", Map.of("sessionId", sessionId));

        Map question = gameTopicMessages.poll(5, TimeUnit.SECONDS);
        assertNotNull(question, "Should receive first question on game topic");
        assertEquals("QUESTION", question.get("type"));
        assertEquals(1, question.get("questionNumber"));
        assertEquals(8, question.get("totalQuestions"));

        inviterSession.disconnect();
        inviteeSession.disconnect();
    }

    @Test
    void testDeclineFlow_InviterReceivesDeclineNotification() throws Exception {
        StompSession inviterSession = connectWithToken(inviterToken);
        StompSession inviteeSession = connectWithToken(inviteeToken);

        BlockingQueue<Map> inviterEvents = new LinkedBlockingQueue<>();
        BlockingQueue<Map> inviteeEvents = new LinkedBlockingQueue<>();

        inviterSession.subscribe("/user/queue/game-events", new StompFrameHandler() {
            @Override
            public Type getPayloadType(StompHeaders headers) { return Map.class; }
            @Override
            public void handleFrame(StompHeaders headers, Object payload) {
                inviterEvents.add((Map) payload);
            }
        });
        inviteeSession.subscribe("/user/queue/game-events", new StompFrameHandler() {
            @Override
            public Type getPayloadType(StompHeaders headers) { return Map.class; }
            @Override
            public void handleFrame(StompHeaders headers, Object payload) {
                inviteeEvents.add((Map) payload);
            }
        });

        Thread.sleep(500);

        inviterSession.send("/app/game.invite",
                Map.of("categoryId", String.valueOf(category.getId())));

        Map invitation = inviteeEvents.poll(5, TimeUnit.SECONDS);
        assertNotNull(invitation);
        String sessionId = invitation.get("sessionId").toString();

        inviteeSession.send("/app/game.decline", Map.of("sessionId", sessionId));

        Map declineNotification = inviterEvents.poll(5, TimeUnit.SECONDS);
        assertNotNull(declineNotification, "Inviter should be notified of decline");

        boolean foundDecline = false;
        if ("INVITATION_DECLINED".equals(declineNotification.get("status"))) {
            foundDecline = true;
        }
        if (!foundDecline) {
            Map next = inviterEvents.poll(3, TimeUnit.SECONDS);
            if (next != null && "INVITATION_DECLINED".equals(next.get("status"))) {
                foundDecline = true;
            }
        }
        assertTrue(foundDecline, "Should receive INVITATION_DECLINED status");

        inviterSession.disconnect();
        inviteeSession.disconnect();
    }

    @Test
    void testAnswerFlow_AnswerRecordedConfirmation() throws Exception {
        StompSession inviterSession = connectWithToken(inviterToken);
        StompSession inviteeSession = connectWithToken(inviteeToken);

        BlockingQueue<Map> inviteeEvents = new LinkedBlockingQueue<>();
        BlockingQueue<Map> inviterStatus = new LinkedBlockingQueue<>();

        inviteeSession.subscribe("/user/queue/game-events", new StompFrameHandler() {
            @Override
            public Type getPayloadType(StompHeaders headers) { return Map.class; }
            @Override
            public void handleFrame(StompHeaders headers, Object payload) {
                inviteeEvents.add((Map) payload);
            }
        });
        inviterSession.subscribe("/user/queue/game-status", new StompFrameHandler() {
            @Override
            public Type getPayloadType(StompHeaders headers) { return Map.class; }
            @Override
            public void handleFrame(StompHeaders headers, Object payload) {
                inviterStatus.add((Map) payload);
            }
        });

        Thread.sleep(500);

        inviterSession.send("/app/game.invite",
                Map.of("categoryId", String.valueOf(category.getId())));

        Map invitation = inviteeEvents.poll(5, TimeUnit.SECONDS);
        assertNotNull(invitation);
        String sessionId = invitation.get("sessionId").toString();

        BlockingQueue<Map> gameMessages = new LinkedBlockingQueue<>();
        inviterSession.subscribe("/topic/game/" + sessionId, new StompFrameHandler() {
            @Override
            public Type getPayloadType(StompHeaders headers) { return Map.class; }
            @Override
            public void handleFrame(StompHeaders headers, Object payload) {
                gameMessages.add((Map) payload);
            }
        });

        Thread.sleep(500);

        inviteeSession.send("/app/game.accept", Map.of("sessionId", sessionId));

        Map firstQ = gameMessages.poll(5, TimeUnit.SECONDS);
        assertNotNull(firstQ, "Should receive first question");
        Integer questionId = (Integer) firstQ.get("questionId");

        inviterSession.send("/app/game.answer",
                Map.of("sessionId", sessionId,
                       "questionId", questionId,
                       "answer", "A"));

        Map confirmation = inviterStatus.poll(5, TimeUnit.SECONDS);
        assertNotNull(confirmation, "Should receive answer confirmation");
        assertEquals("ANSWER_RECORDED", confirmation.get("status"));

        inviterSession.disconnect();
        inviteeSession.disconnect();
    }
}
