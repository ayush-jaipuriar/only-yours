package com.onlyyours.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.onlyyours.model.Couple;
import com.onlyyours.model.GameSession;
import com.onlyyours.model.QuestionCategory;
import com.onlyyours.model.Question;
import com.onlyyours.model.User;
import com.onlyyours.repository.CoupleRepository;
import com.onlyyours.repository.GameSessionRepository;
import com.onlyyours.repository.QuestionCategoryRepository;
import com.onlyyours.repository.QuestionRepository;
import com.onlyyours.repository.UserRepository;
import com.onlyyours.service.GameService;
import com.onlyyours.service.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.Date;
import java.util.Map;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class RestControllerTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private JwtService jwtService;
    @Autowired private GameService gameService;
    @Autowired private UserRepository userRepo;
    @Autowired private CoupleRepository coupleRepo;
    @Autowired private GameSessionRepository gameSessionRepo;
    @Autowired private QuestionCategoryRepository categoryRepo;
    @Autowired private QuestionRepository questionRepo;

    private User testUser;
    private String validToken;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setEmail("test@example.com");
        testUser.setName("Test User");
        testUser.setGoogleUserId("google-test-123");
        testUser = userRepo.save(testUser);

        UserDetails userDetails = new org.springframework.security.core.userdetails.User(
                testUser.getEmail(), "", Collections.emptyList());
        validToken = jwtService.generateToken(userDetails);
    }

    private User createPartner(String email, String name, String googleId) {
        User partner = new User();
        partner.setEmail(email);
        partner.setName(name);
        partner.setGoogleUserId(googleId);
        return userRepo.save(partner);
    }

    private QuestionCategory createCategoryWithQuestions(String namePrefix) {
        QuestionCategory category = new QuestionCategory();
        category.setName(namePrefix + " Category");
        category.setDescription("Test category for game query endpoints");
        category.setSensitive(false);
        category = categoryRepo.save(category);

        for (int i = 1; i <= 10; i++) {
            Question q = new Question();
            q.setCategory(category);
            q.setText(namePrefix + " Question " + i);
            q.setOptionA("A" + i);
            q.setOptionB("B" + i);
            q.setOptionC("C" + i);
            q.setOptionD("D" + i);
            questionRepo.save(q);
        }

        return category;
    }

    private GameSession createCompletedSessionForCouple(
            Couple couple,
            Integer categoryId,
            int player1Score,
            int player2Score,
            int daysAgo
    ) {
        long now = System.currentTimeMillis();
        Date createdAt = new Date(now - (daysAgo * 24L * 60L * 60L * 1000L) - (2L * 60L * 60L * 1000L));
        Date startedAt = new Date(createdAt.getTime() + (90L * 1000L));
        Date completedAt = new Date(createdAt.getTime() + (3L * 60L * 60L * 1000L));

        GameSession session = new GameSession();
        session.setCouple(couple);
        session.setStatus(GameSession.GameStatus.COMPLETED);
        session.setCategoryId(categoryId);
        session.setPlayer1Score(player1Score);
        session.setPlayer2Score(player2Score);
        session.setCreatedAt(createdAt);
        session.setStartedAt(startedAt);
        session.setCompletedAt(completedAt);
        session.setLastActivityAt(completedAt);
        session.setExpiresAt(completedAt);
        return gameSessionRepo.save(session);
    }

    // ============ Security Tests ============

    @Nested
    class SecurityTests {
        @Test
        void protectedEndpoint_WithoutToken_Returns401Or403() throws Exception {
            mockMvc.perform(get("/api/user/me"))
                    .andExpect(status().is4xxClientError());
        }

        @Test
        void protectedEndpoint_WithValidToken_Returns200() throws Exception {
            mockMvc.perform(get("/api/user/me")
                            .header("Authorization", "Bearer " + validToken))
                    .andExpect(status().isOk());
        }

        @Test
        void protectedEndpoint_WithMalformedToken_Returns401Or403() throws Exception {
            mockMvc.perform(get("/api/user/me")
                            .header("Authorization", "Bearer invalid.token.here"))
                    .andExpect(status().is4xxClientError());
        }

        @Test
        void authEndpoint_WithoutToken_IsAccessible() throws Exception {
            mockMvc.perform(post("/api/auth/google/signin")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"idToken\": \"fake-token\"}"))
                    .andExpect(status().is4xxClientError());
        }
    }

    // ============ UserController Tests ============

    @Nested
    class UserControllerTests {
        @Test
        void getMe_ReturnsCurrentUser() throws Exception {
            mockMvc.perform(get("/api/user/me")
                            .header("Authorization", "Bearer " + validToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.name").value("Test User"))
                    .andExpect(jsonPath("$.email").value("test@example.com"))
                    .andExpect(jsonPath("$.id").isNotEmpty());
        }
    }

    // ============ CoupleController Tests ============

    @Nested
    class CoupleControllerTests {
        @Test
        void generateCode_ReturnsCode() throws Exception {
            mockMvc.perform(post("/api/couple/generate-code")
                            .header("Authorization", "Bearer " + validToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").isNotEmpty())
                    .andExpect(jsonPath("$.code", hasLength(6)));
        }

        @Test
        void getCouple_WhenNotLinked_Returns404() throws Exception {
            mockMvc.perform(get("/api/couple")
                            .header("Authorization", "Bearer " + validToken))
                    .andExpect(status().isNotFound());
        }

        @Test
        void linkCode_ValidFlow_ReturnsCouple() throws Exception {
            String codeResponse = mockMvc.perform(post("/api/couple/generate-code")
                            .header("Authorization", "Bearer " + validToken))
                    .andReturn().getResponse().getContentAsString();
            String code = objectMapper.readTree(codeResponse).get("code").asText();

            User partner = new User();
            partner.setEmail("partner@example.com");
            partner.setName("Partner");
            partner.setGoogleUserId("google-partner-456");
            partner = userRepo.save(partner);

            UserDetails partnerDetails = new org.springframework.security.core.userdetails.User(
                    partner.getEmail(), "", Collections.emptyList());
            String partnerToken = jwtService.generateToken(partnerDetails);

            mockMvc.perform(post("/api/couple/link")
                            .header("Authorization", "Bearer " + partnerToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(Map.of("code", code))))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.user1.name").value("Test User"))
                    .andExpect(jsonPath("$.user2.name").value("Partner"));
        }

        @Test
        void getCouple_WhenLinked_ReturnsCoupleDto() throws Exception {
            User partner = new User();
            partner.setEmail("partner2@example.com");
            partner.setName("Partner2");
            partner.setGoogleUserId("google-partner2");
            partner = userRepo.save(partner);

            Couple couple = new Couple();
            couple.setUser1(testUser);
            couple.setUser2(partner);
            coupleRepo.save(couple);

            mockMvc.perform(get("/api/couple")
                            .header("Authorization", "Bearer " + validToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.user1.email").value("test@example.com"))
                    .andExpect(jsonPath("$.user2.email").value("partner2@example.com"));
        }

        @Test
        void linkCode_EmptyCode_ReturnsBadRequest() throws Exception {
            mockMvc.perform(post("/api/couple/link")
                            .header("Authorization", "Bearer " + validToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"code\": \"\"}"))
                    .andExpect(status().isBadRequest());
        }
    }

    // ============ GameQueryController Tests ============

    @Nested
    class GameQueryControllerTests {
        @Test
        void getActive_WhenNoActiveSession_Returns404() throws Exception {
            mockMvc.perform(get("/api/game/active")
                            .header("Authorization", "Bearer " + validToken))
                    .andExpect(status().isNotFound())
                    .andExpect(jsonPath("$.error").value("No active game session"));
        }

        @Test
        void getActive_WhenActiveSessionExists_ReturnsSummary() throws Exception {
            User partner = createPartner("active-partner@example.com", "Active Partner", "google-active-partner");
            Couple couple = new Couple();
            couple.setUser1(testUser);
            couple.setUser2(partner);
            coupleRepo.save(couple);

            QuestionCategory category = createCategoryWithQuestions("Active");
            var invitation = gameService.createInvitation(testUser.getId(), category.getId());

            mockMvc.perform(get("/api/game/active")
                            .header("Authorization", "Bearer " + validToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.sessionId").value(invitation.getSessionId().toString()))
                    .andExpect(jsonPath("$.status").value("INVITED"))
                    .andExpect(jsonPath("$.partnerName").value("Active Partner"))
                    .andExpect(jsonPath("$.canContinue").value(true));
        }

        @Test
        void getHistory_ReturnsPaginatedItemsAndWinnerFilter() throws Exception {
            User partner = createPartner("history-partner@example.com", "History Partner", "google-history-partner");
            Couple couple = new Couple();
            couple.setUser1(testUser);
            couple.setUser2(partner);
            couple = coupleRepo.save(couple);

            QuestionCategory category = createCategoryWithQuestions("History");
            createCompletedSessionForCouple(couple, category.getId(), 7, 3, 0); // self win
            createCompletedSessionForCouple(couple, category.getId(), 4, 6, 1); // partner win
            createCompletedSessionForCouple(couple, category.getId(), 5, 5, 2); // draw

            mockMvc.perform(get("/api/game/history")
                            .param("page", "0")
                            .param("size", "2")
                            .param("sort", "recent")
                            .param("winner", "all")
                            .header("Authorization", "Bearer " + validToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.items", hasSize(2)))
                    .andExpect(jsonPath("$.totalElements").value(3))
                    .andExpect(jsonPath("$.hasNext").value(true));

            mockMvc.perform(get("/api/game/history")
                            .param("page", "0")
                            .param("size", "10")
                            .param("sort", "recent")
                            .param("winner", "self")
                            .header("Authorization", "Bearer " + validToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.totalElements").value(1))
                    .andExpect(jsonPath("$.items[0].result").value("WIN"));
        }

        @Test
        void getStats_ReturnsDashboardMetrics() throws Exception {
            User partner = createPartner("stats-partner@example.com", "Stats Partner", "google-stats-partner");
            Couple couple = new Couple();
            couple.setUser1(testUser);
            couple.setUser2(partner);
            couple = coupleRepo.save(couple);

            QuestionCategory category = createCategoryWithQuestions("Stats");
            createCompletedSessionForCouple(couple, category.getId(), 6, 4, 0);
            createCompletedSessionForCouple(couple, category.getId(), 4, 7, 1);

            GameSession declinedSession = new GameSession();
            declinedSession.setCouple(couple);
            declinedSession.setStatus(GameSession.GameStatus.DECLINED);
            declinedSession.setCategoryId(category.getId());
            Date declinedCreatedAt = new Date(System.currentTimeMillis() - (2L * 24L * 60L * 60L * 1000L));
            declinedSession.setCreatedAt(declinedCreatedAt);
            declinedSession.setCompletedAt(new Date(declinedCreatedAt.getTime() + (60L * 60L * 1000L)));
            declinedSession.setLastActivityAt(declinedSession.getCompletedAt());
            declinedSession.setExpiresAt(declinedSession.getCompletedAt());
            gameSessionRepo.save(declinedSession);

            GameSession pendingInvitation = new GameSession();
            pendingInvitation.setCouple(couple);
            pendingInvitation.setStatus(GameSession.GameStatus.INVITED);
            pendingInvitation.setCategoryId(category.getId());
            pendingInvitation.setCreatedAt(new Date(System.currentTimeMillis() - (3L * 24L * 60L * 60L * 1000L)));
            pendingInvitation.setLastActivityAt(pendingInvitation.getCreatedAt());
            pendingInvitation.setExpiresAt(new Date(pendingInvitation.getCreatedAt().getTime() + (7L * 24L * 60L * 60L * 1000L)));
            gameSessionRepo.save(pendingInvitation);

            mockMvc.perform(get("/api/game/stats")
                            .header("Authorization", "Bearer " + validToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.gamesPlayed").value(2))
                    .andExpect(jsonPath("$.averageScore").value(5.0))
                    .andExpect(jsonPath("$.bestScore").value(6))
                    .andExpect(jsonPath("$.streakDays").value(2))
                    .andExpect(jsonPath("$.invitationAcceptanceRate").value(66.67))
                    .andExpect(jsonPath("$.avgInvitationResponseSeconds").value(90.0));
        }

        @Test
        void getBadges_ReturnsEarnedBadgeList() throws Exception {
            User partner = createPartner("badges-partner@example.com", "Badges Partner", "google-badges-partner");
            Couple couple = new Couple();
            couple.setUser1(testUser);
            couple.setUser2(partner);
            couple = coupleRepo.save(couple);

            QuestionCategory category = createCategoryWithQuestions("Badges");
            createCompletedSessionForCouple(couple, category.getId(), 8, 3, 0);
            createCompletedSessionForCouple(couple, category.getId(), 7, 4, 1);
            createCompletedSessionForCouple(couple, category.getId(), 6, 4, 2);
            createCompletedSessionForCouple(couple, category.getId(), 5, 4, 3);
            createCompletedSessionForCouple(couple, category.getId(), 4, 4, 4);

            mockMvc.perform(get("/api/game/badges")
                            .header("Authorization", "Bearer " + validToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.badges", not(empty())))
                    .andExpect(jsonPath("$.badges[?(@.code == 'FIRST_GAME')]", not(empty())))
                    .andExpect(jsonPath("$.badges[?(@.code == 'FIVE_GAMES')]", not(empty())));
        }

        @Test
        void getCurrentQuestion_WhenRound1Session_ReturnsQuestionPayload() throws Exception {
            User partner = createPartner("round1-partner@example.com", "Round1 Partner", "google-round1-partner");
            Couple couple = new Couple();
            couple.setUser1(testUser);
            couple.setUser2(partner);
            coupleRepo.save(couple);

            QuestionCategory category = createCategoryWithQuestions("Round1");
            var invitation = gameService.createInvitation(testUser.getId(), category.getId());
            gameService.acceptInvitation(invitation.getSessionId(), partner.getId());

            mockMvc.perform(get("/api/game/" + invitation.getSessionId() + "/current-question")
                            .header("Authorization", "Bearer " + validToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.type").value("QUESTION"))
                    .andExpect(jsonPath("$.round").value("ROUND1"))
                    .andExpect(jsonPath("$.questionNumber").value(1));
        }

        @Test
        void getCurrentQuestion_WhenSessionExpired_Returns410() throws Exception {
            User partner = createPartner("expired-partner@example.com", "Expired Partner", "google-expired-partner");
            Couple couple = new Couple();
            couple.setUser1(testUser);
            couple.setUser2(partner);
            coupleRepo.save(couple);

            QuestionCategory category = createCategoryWithQuestions("Expired");
            var invitation = gameService.createInvitation(testUser.getId(), category.getId());
            gameService.acceptInvitation(invitation.getSessionId(), partner.getId());

            GameSession session = gameSessionRepo.findById(invitation.getSessionId()).orElseThrow();
            session.setExpiresAt(new Date(System.currentTimeMillis() - 60_000));
            gameSessionRepo.save(session);

            mockMvc.perform(get("/api/game/" + invitation.getSessionId() + "/current-question")
                            .header("Authorization", "Bearer " + validToken))
                    .andExpect(status().isGone())
                    .andExpect(jsonPath("$.error").value("Game session expired"));
        }
    }

    // ============ ContentController Tests ============

    @Nested
    class ContentControllerTests {
        @Test
        void getCategories_ReturnsList() throws Exception {
            QuestionCategory cat = new QuestionCategory();
            cat.setName("Test Cat");
            cat.setDescription("Desc");
            cat.setSensitive(false);
            categoryRepo.save(cat);

            mockMvc.perform(get("/api/content/categories")
                            .header("Authorization", "Bearer " + validToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$", hasSize(greaterThanOrEqualTo(1))))
                    .andExpect(jsonPath("$[0].name").isNotEmpty());
        }

        @Test
        void getCategories_IncludesSensitiveFlag() throws Exception {
            QuestionCategory sensitive = new QuestionCategory();
            sensitive.setName("Sensitive Cat");
            sensitive.setDescription("Adult content");
            sensitive.setSensitive(true);
            categoryRepo.save(sensitive);

            mockMvc.perform(get("/api/content/categories")
                            .header("Authorization", "Bearer " + validToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$[?(@.name == 'Sensitive Cat')].sensitive").value(true));
        }
    }
}
