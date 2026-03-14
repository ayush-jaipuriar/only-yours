package com.onlyyours.service;

import com.onlyyours.dto.ProgressionSummaryDto;
import com.onlyyours.model.Couple;
import com.onlyyours.model.GameSession;
import com.onlyyours.model.User;
import com.onlyyours.repository.CoupleProgressionRepository;
import com.onlyyours.repository.CoupleRepository;
import com.onlyyours.repository.GameSessionRepository;
import com.onlyyours.repository.UserProgressionRepository;
import com.onlyyours.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.util.Date;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
@Transactional
class ProgressionServiceTest {

    @Autowired private ProgressionService progressionService;
    @Autowired private UserRepository userRepository;
    @Autowired private CoupleRepository coupleRepository;
    @Autowired private GameSessionRepository gameSessionRepository;
    @Autowired private UserProgressionRepository userProgressionRepository;
    @Autowired private CoupleProgressionRepository coupleProgressionRepository;

    private User user1;
    private User user2;
    private Couple couple;

    @BeforeEach
    void setUp() {
        user1 = new User();
        user1.setEmail("progression-user-1@test.com");
        user1.setName("Progression User 1");
        user1.setGoogleUserId("progression-google-1");
        user1.setUsername("progression_user_1");
        user1.setBio("Ready to grow.");
        user1 = userRepository.save(user1);

        user2 = new User();
        user2.setEmail("progression-user-2@test.com");
        user2.setName("Progression User 2");
        user2.setGoogleUserId("progression-google-2");
        user2 = userRepository.save(user2);

        couple = new Couple();
        couple.setUser1(user1);
        couple.setUser2(user2);
        couple.setStatus(Couple.RelationshipStatus.ACTIVE);
        couple = coupleRepository.save(couple);
    }

    @Test
    void getProgressionSummary_bootstrapsHistoryAndDailyLoginIsIdempotent() {
        createCompletedSession(6, 5, 2);
        createCompletedSession(8, 7, 1);

        ProgressionSummaryDto first = progressionService.getProgressionSummary(user1.getId());
        ProgressionSummaryDto second = progressionService.getProgressionSummary(user1.getId());

        assertNotNull(first.getIndividualProgression());
        assertNotNull(first.getCoupleProgression());
        assertTrue(first.getIndividualProgression().getXp() > 0);
        assertTrue(first.getCoupleProgression().getXp() > 0);
        assertFalse(first.getAchievements().isEmpty());

        var savedUserProgression = userProgressionRepository.findByUser_Id(user1.getId()).orElseThrow();
        var savedCoupleProgression = coupleProgressionRepository.findByCouple_Id(couple.getId()).orElseThrow();

        assertEquals(1, savedUserProgression.getDailyLoginDays());
        assertTrue(savedCoupleProgression.getGamesCompleted() >= 2);
        assertEquals(first.getIndividualProgression().getXp(), second.getIndividualProgression().getXp());
    }

    @Test
    void processCompletedGame_initializesSnapshotsWithoutDoubleCountingCurrentSession() {
        GameSession session = createCompletedSession(7, 4, 0);

        ProgressionService.GameCompletionProgressionResult result =
                progressionService.processCompletedGame(session, 7, 4);

        var savedUserProgression = userProgressionRepository.findByUser_Id(user1.getId()).orElseThrow();
        var savedCoupleProgression = coupleProgressionRepository.findByCouple_Id(couple.getId()).orElseThrow();

        assertNotNull(result.coupleProgression());
        assertFalse(result.recentMilestones().isEmpty());
        assertEquals(1, savedUserProgression.getGamesCompleted());
        assertEquals(1, savedUserProgression.getGamesWon());
        assertEquals(1, savedCoupleProgression.getGamesCompleted());
        assertTrue(savedCoupleProgression.getXp() > 0);
        assertTrue(result.recentMilestones().stream().allMatch(milestone -> "COUPLE".equals(milestone.getScope())));
    }

    @Test
    void getProgressionSummary_returnsPersistedRecentMilestonesAcrossRequests() {
        GameSession session = createCompletedSession(7, 4, 0);
        progressionService.processCompletedGame(session, 7, 4);

        ProgressionSummaryDto first = progressionService.getProgressionSummary(user1.getId());
        ProgressionSummaryDto second = progressionService.getProgressionSummary(user1.getId());

        assertFalse(first.getRecentMilestones().isEmpty());
        assertFalse(second.getRecentMilestones().isEmpty());
    }

    @Test
    void getProgressionSummary_dropsCurrentStreakAfterInactiveGap() {
        createCompletedSession(6, 5, 6);
        createCompletedSession(7, 6, 5);

        ProgressionSummaryDto summary = progressionService.getProgressionSummary(user1.getId());

        assertEquals(0, summary.getIndividualProgression().getCurrentStreakDays());
        assertEquals(0, summary.getCoupleProgression().getCurrentStreakDays());
        assertTrue(summary.getIndividualProgression().getLongestStreakDays() >= 2);
    }

    private GameSession createCompletedSession(int player1Score, int player2Score, int daysAgo) {
        long now = System.currentTimeMillis();
        Date createdAt = new Date(now - (daysAgo * 24L * 60L * 60L * 1000L));

        GameSession session = new GameSession();
        session.setCouple(couple);
        session.setStatus(GameSession.GameStatus.COMPLETED);
        session.setPlayer1Score(player1Score);
        session.setPlayer2Score(player2Score);
        session.setCreatedAt(createdAt);
        session.setStartedAt(createdAt);
        session.setCompletedAt(createdAt);
        session.setLastActivityAt(createdAt);
        session.setExpiresAt(createdAt);
        session.setCurrentQuestionIndex(7);
        return gameSessionRepository.save(session);
    }
}
