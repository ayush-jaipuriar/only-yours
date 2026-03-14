package com.onlyyours.integration;

import com.onlyyours.model.Couple;
import com.onlyyours.model.GameSession;
import com.onlyyours.model.User;
import com.onlyyours.repository.CoupleRepository;
import com.onlyyours.repository.GameSessionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.Date;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class ProgressionFlowIntegrationTest extends BaseIntegrationTest {

    @Autowired
    private CoupleRepository coupleRepository;

    @Autowired
    private GameSessionRepository gameSessionRepository;

    private User user1;
    private User user2;

    @BeforeEach
    void setUp() {
        user1 = createTestUser("progress-user-1@example.com", "Progress User 1", "progress-google-1");
        user2 = createTestUser("progress-user-2@example.com", "Progress User 2", "progress-google-2");

        Couple couple = new Couple();
        couple.setUser1(user1);
        couple.setUser2(user2);
        couple.setStatus(Couple.RelationshipStatus.ACTIVE);
        Couple savedCouple = coupleRepository.save(couple);

        GameSession session = new GameSession();
        session.setCouple(savedCouple);
        session.setStatus(GameSession.GameStatus.COMPLETED);
        session.setPlayer1Score(6);
        session.setPlayer2Score(5);
        Date now = new Date();
        session.setCreatedAt(now);
        session.setStartedAt(now);
        session.setCompletedAt(now);
        session.setLastActivityAt(now);
        session.setExpiresAt(now);
        session.setCurrentQuestionIndex(7);
        gameSessionRepository.save(session);
    }

    @Test
    void progressionEndpoint_ReturnsIndividualAndCoupleSnapshots() throws Exception {
        mockMvc.perform(get("/api/game/progression")
                        .header("Authorization", bearerHeader(user1)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.individualProgression.scope").value("USER"))
                .andExpect(jsonPath("$.individualProgression.level").isNumber())
                .andExpect(jsonPath("$.coupleProgression.scope").value("COUPLE"))
                .andExpect(jsonPath("$.coupleProgression.level").isNumber())
                .andExpect(jsonPath("$.achievements").isArray())
                .andExpect(jsonPath("$.recentMilestones").isArray());
    }
}
