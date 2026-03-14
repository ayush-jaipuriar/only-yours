package com.onlyyours.service;

import com.onlyyours.dto.BadgeDto;
import com.onlyyours.dto.ProgressionMilestoneDto;
import com.onlyyours.dto.ProgressionSnapshotDto;
import com.onlyyours.dto.ProgressionSummaryDto;
import com.onlyyours.model.Couple;
import com.onlyyours.model.CoupleProgression;
import com.onlyyours.model.GameSession;
import com.onlyyours.model.ProgressionEvent;
import com.onlyyours.model.User;
import com.onlyyours.model.UserProgression;
import com.onlyyours.repository.CoupleProgressionRepository;
import com.onlyyours.repository.CoupleRepository;
import com.onlyyours.repository.GameAnswerRepository;
import com.onlyyours.repository.GameSessionRepository;
import com.onlyyours.repository.ProgressionEventRepository;
import com.onlyyours.repository.UserProgressionRepository;
import com.onlyyours.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.function.Consumer;
import java.util.function.Predicate;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProgressionService {

    private static final long USER_DAILY_LOGIN_XP = 12L;
    private static final long USER_PROFILE_COMPLETION_XP = 25L;
    private static final long USER_GAME_COMPLETION_XP = 60L;
    private static final long USER_GAME_WIN_XP = 30L;
    private static final long USER_CORRECT_GUESS_XP = 8L;
    private static final long USER_ANSWER_ALL_XP = 10L;
    private static final long COUPLE_GAME_COMPLETION_XP = 90L;
    private static final long COUPLE_CONSISTENCY_XP = 15L;
    private static final long ACHIEVEMENT_UNLOCK_XP = 20L;
    private static final int QUESTIONS_PER_GAME = 8;

    private final UserRepository userRepository;
    private final CoupleRepository coupleRepository;
    private final GameSessionRepository gameSessionRepository;
    private final GameAnswerRepository gameAnswerRepository;
    private final UserProgressionRepository userProgressionRepository;
    private final CoupleProgressionRepository coupleProgressionRepository;
    private final ProgressionEventRepository progressionEventRepository;

    @Transactional
    public ProgressionSummaryDto getProgressionSummary(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

        List<ProgressionMilestoneDto> progressionSideEffects = new ArrayList<>();
        UserProgression userProgression = getOrInitializeUserProgression(user, null);

        recordDailyLogin(user, userProgression, progressionSideEffects);

        Optional<Couple> activeCouple = findActiveCouple(user.getId());

        if (isProfileComplete(user) && !Boolean.TRUE.equals(userProgression.getProfileCompleted())) {
            applyProfileCompletion(userProgression, progressionSideEffects);
            evaluateUserAchievements(userProgression, progressionSideEffects);
        }

        CoupleProgression coupleProgression = activeCouple
                .map(couple -> getOrInitializeCoupleProgression(couple, null))
                .orElse(null);

        return buildSummary(user, userProgression, activeCouple.orElse(null), coupleProgression);
    }

    @Transactional
    public void recordProfileCompletion(User user) {
        if (!isProfileComplete(user)) {
            return;
        }

        UserProgression userProgression = getOrInitializeUserProgression(user, null);
        if (Boolean.TRUE.equals(userProgression.getProfileCompleted())) {
            return;
        }

        applyProfileCompletion(userProgression, new ArrayList<>());
        evaluateUserAchievements(userProgression, new ArrayList<>());
    }

    @Transactional
    public GameCompletionProgressionResult processCompletedGame(
            GameSession session,
            int player1Score,
            int player2Score
    ) {
        Couple couple = session.getCouple();
        User player1 = couple.getUser1();
        User player2 = couple.getUser2();
        UUID sessionId = session.getId();

        UserProgression player1Progression = getOrInitializeUserProgression(player1, sessionId);
        UserProgression player2Progression = getOrInitializeUserProgression(player2, sessionId);
        CoupleProgression coupleProgression = getOrInitializeCoupleProgression(couple, sessionId);

        List<ProgressionMilestoneDto> recentMilestones = new ArrayList<>();

        applyUserXpEvent(
                player1Progression,
                "game-complete:" + sessionId,
                ProgressionEvent.EventType.GAME_COMPLETED,
                USER_GAME_COMPLETION_XP,
                null,
                progression -> {
                    progression.setGamesCompleted(progression.getGamesCompleted() + 1);
                    progression.setBestScore(Math.max(progression.getBestScore(), player1Score));
                    progression.setLastActiveOn(resolveLocalDate(player1, session.getCompletedAt()));
                },
                recentMilestones,
                true
        );
        applyUserXpEvent(
                player2Progression,
                "game-complete:" + sessionId,
                ProgressionEvent.EventType.GAME_COMPLETED,
                USER_GAME_COMPLETION_XP,
                null,
                progression -> {
                    progression.setGamesCompleted(progression.getGamesCompleted() + 1);
                    progression.setBestScore(Math.max(progression.getBestScore(), player2Score));
                    progression.setLastActiveOn(resolveLocalDate(player2, session.getCompletedAt()));
                },
                recentMilestones,
                true
        );

        applyUserXpEvent(
                player1Progression,
                "correct-guesses:" + sessionId,
                ProgressionEvent.EventType.CORRECT_GUESSES,
                player1Score * USER_CORRECT_GUESS_XP,
                null,
                progression -> progression.setCorrectGuesses(progression.getCorrectGuesses() + player1Score),
                recentMilestones,
                true
        );
        applyUserXpEvent(
                player2Progression,
                "correct-guesses:" + sessionId,
                ProgressionEvent.EventType.CORRECT_GUESSES,
                player2Score * USER_CORRECT_GUESS_XP,
                null,
                progression -> progression.setCorrectGuesses(progression.getCorrectGuesses() + player2Score),
                recentMilestones,
                true
        );

        if (hasAnsweredAllQuestions(sessionId, player1.getId())) {
            applyUserXpEvent(
                    player1Progression,
                    "answer-all:" + sessionId,
                    ProgressionEvent.EventType.ANSWER_ALL,
                    USER_ANSWER_ALL_XP,
                    null,
                    progression -> progression.setAnswerAllGames(progression.getAnswerAllGames() + 1),
                    recentMilestones,
                    true
            );
        }
        if (hasAnsweredAllQuestions(sessionId, player2.getId())) {
            applyUserXpEvent(
                    player2Progression,
                    "answer-all:" + sessionId,
                    ProgressionEvent.EventType.ANSWER_ALL,
                    USER_ANSWER_ALL_XP,
                    null,
                    progression -> progression.setAnswerAllGames(progression.getAnswerAllGames() + 1),
                    recentMilestones,
                    true
            );
        }

        if (player1Score > player2Score) {
            applyUserXpEvent(
                    player1Progression,
                    "game-win:" + sessionId,
                    ProgressionEvent.EventType.GAME_WIN,
                    USER_GAME_WIN_XP,
                    null,
                    progression -> progression.setGamesWon(progression.getGamesWon() + 1),
                    recentMilestones,
                    true
            );
        } else if (player2Score > player1Score) {
            applyUserXpEvent(
                    player2Progression,
                    "game-win:" + sessionId,
                    ProgressionEvent.EventType.GAME_WIN,
                    USER_GAME_WIN_XP,
                    null,
                    progression -> progression.setGamesWon(progression.getGamesWon() + 1),
                    recentMilestones,
                    true
            );
        }

        int combinedScore = player1Score + player2Score;
        applyCoupleXpEvent(
                coupleProgression,
                "couple-game-complete:" + sessionId,
                ProgressionEvent.EventType.GAME_COMPLETED,
                COUPLE_GAME_COMPLETION_XP,
                null,
                progression -> {
                    progression.setGamesCompleted(progression.getGamesCompleted() + 1);
                    progression.setTotalCombinedScore(progression.getTotalCombinedScore() + combinedScore);
                    progression.setBestCombinedScore(Math.max(progression.getBestCombinedScore(), combinedScore));
                    progression.setLastActiveOn(resolveCoupleLocalDate(couple, session.getCompletedAt()));
                },
                recentMilestones,
                true
        );
        applyCoupleXpEvent(
                coupleProgression,
                "couple-consistency:" + sessionId,
                ProgressionEvent.EventType.CONSISTENCY_BONUS,
                COUPLE_CONSISTENCY_XP,
                null,
                progression -> { },
                recentMilestones,
                true
        );

        refreshUserStreak(player1, player1Progression);
        refreshUserStreak(player2, player2Progression);
        refreshCoupleStreak(couple, coupleProgression);

        evaluateUserAchievements(player1Progression, recentMilestones);
        evaluateUserAchievements(player2Progression, recentMilestones);
        evaluateCoupleAchievements(coupleProgression, recentMilestones);

        return new GameCompletionProgressionResult(
                toSnapshotDto(
                        "COUPLE",
                        buildCoupleLabel(couple),
                        coupleProgression,
                        countAchievementUnlocks(ProgressionEvent.ScopeType.COUPLE, couple.getId())
                ),
                recentMilestones.stream()
                        .filter(milestone -> "COUPLE".equals(milestone.getScope()))
                        .sorted(Comparator.comparing(ProgressionMilestoneDto::getEarnedAt, Comparator.nullsLast(Long::compareTo)).reversed())
                        .limit(8)
                        .toList()
        );
    }

    private ProgressionSummaryDto buildSummary(
            User user,
            UserProgression userProgression,
            Couple activeCouple,
            CoupleProgression coupleProgression
    ) {
        List<BadgeDto> achievements = new ArrayList<>(getUserAchievements(userProgression));

        if (activeCouple != null && coupleProgression != null) {
            achievements.addAll(getCoupleAchievements(coupleProgression));
        }

        achievements.sort(Comparator
                .comparing(BadgeDto::getEarnedAt, Comparator.nullsLast(Long::compareTo))
                .reversed()
                .thenComparing(BadgeDto::getTitle));

        return ProgressionSummaryDto.builder()
                .individualProgression(toSnapshotDto(
                        "USER",
                        "You",
                        userProgression,
                        countAchievementUnlocks(ProgressionEvent.ScopeType.USER, user.getId())
                ))
                .coupleProgression(Optional.ofNullable(activeCouple)
                        .filter(couple -> coupleProgression != null)
                        .map(couple -> toSnapshotDto(
                                "COUPLE",
                                buildCoupleLabel(couple),
                                coupleProgression,
                                countAchievementUnlocks(ProgressionEvent.ScopeType.COUPLE, couple.getId())
                        ))
                        .orElse(null))
                .achievements(achievements)
                .recentMilestones(getRecentMilestones(user, activeCouple, 8))
                .build();
    }

    private List<ProgressionMilestoneDto> getRecentMilestones(User user, Couple activeCouple, int limit) {
        List<ProgressionEvent> recentEvents = new ArrayList<>(
                progressionEventRepository.findTop12ByScopeTypeAndScopeRefIdOrderByCreatedAtDesc(
                        ProgressionEvent.ScopeType.USER,
                        user.getId()
                )
        );

        if (activeCouple != null) {
            recentEvents.addAll(progressionEventRepository.findTop12ByScopeTypeAndScopeRefIdOrderByCreatedAtDesc(
                    ProgressionEvent.ScopeType.COUPLE,
                    activeCouple.getId()
            ));
        }

        return recentEvents.stream()
                .sorted(Comparator.comparing(ProgressionEvent::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder())).reversed())
                .map(event -> toMilestoneDto(event, activeCouple))
                .filter(Objects::nonNull)
                .limit(limit)
                .toList();
    }

    private UserProgression getOrInitializeUserProgression(User user, UUID excludeSessionId) {
        return userProgressionRepository.findByUserIdForUpdate(user.getId())
                .orElseGet(() -> bootstrapUserProgression(user, excludeSessionId));
    }

    private CoupleProgression getOrInitializeCoupleProgression(Couple couple, UUID excludeSessionId) {
        return coupleProgressionRepository.findByCoupleIdForUpdate(couple.getId())
                .orElseGet(() -> bootstrapCoupleProgression(couple, excludeSessionId));
    }

    private UserProgression bootstrapUserProgression(User user, UUID excludeSessionId) {
        log.info("Bootstrapping user progression: userId={}, excludeSessionId={}", user.getId(), excludeSessionId);
        List<GameSession> completedSessions = gameSessionRepository.findAllByUserIdAndStatusOrderByCompletedAtDesc(
                user.getId(),
                GameSession.GameStatus.COMPLETED
        ).stream()
                .filter(session -> excludeSessionId == null || !session.getId().equals(excludeSessionId))
                .toList();

        UserProgression progression = new UserProgression();
        progression.setUser(user);

        int gamesCompleted = completedSessions.size();
        int gamesWon = 0;
        int correctGuesses = 0;
        int answerAllGames = 0;
        int bestScore = 0;

        for (GameSession session : completedSessions) {
            int myScore = resolveMyScore(session, user.getId());
            correctGuesses += myScore;
            bestScore = Math.max(bestScore, myScore);
            if (didUserWin(session, user.getId())) {
                gamesWon++;
            }
            if (hasAnsweredAllQuestions(session.getId(), user.getId())) {
                answerAllGames++;
            }
        }

        progression.setGamesCompleted(gamesCompleted);
        progression.setGamesWon(gamesWon);
        progression.setCorrectGuesses(correctGuesses);
        progression.setAnswerAllGames(answerAllGames);
        progression.setBestScore(bestScore);
        progression.setProfileCompleted(isProfileComplete(user));
        progression.setXp(
                (gamesCompleted * USER_GAME_COMPLETION_XP)
                        + (gamesWon * USER_GAME_WIN_XP)
                        + (correctGuesses * USER_CORRECT_GUESS_XP)
                        + (answerAllGames * USER_ANSWER_ALL_XP)
                        + (isProfileComplete(user) ? USER_PROFILE_COMPLETION_XP : 0L)
        );

        recalculateLevel(progression);
        try {
            progression = userProgressionRepository.saveAndFlush(progression);
        } catch (DataIntegrityViolationException ex) {
            log.debug("User progression bootstrap raced for userId={}, refetching existing row", user.getId());
            return userProgressionRepository.findByUserIdForUpdate(user.getId()).orElseThrow();
        }
        refreshUserStreak(user, progression);
        evaluateUserAchievements(progression, new ArrayList<>());
        return userProgressionRepository.findByUserIdForUpdate(user.getId()).orElse(progression);
    }

    private CoupleProgression bootstrapCoupleProgression(Couple couple, UUID excludeSessionId) {
        log.info("Bootstrapping couple progression: coupleId={}, excludeSessionId={}", couple.getId(), excludeSessionId);
        List<GameSession> completedSessions = gameSessionRepository.findByCouple_IdOrderByCreatedAtDesc(couple.getId())
                .stream()
                .filter(session -> session.getStatus() == GameSession.GameStatus.COMPLETED)
                .filter(session -> excludeSessionId == null || !session.getId().equals(excludeSessionId))
                .toList();

        CoupleProgression progression = new CoupleProgression();
        progression.setCouple(couple);
        progression.setGamesCompleted(completedSessions.size());
        progression.setTotalCombinedScore(completedSessions.stream()
                .mapToInt(session -> resolveCombinedScore(session))
                .sum());
        progression.setBestCombinedScore(completedSessions.stream()
                .mapToInt(this::resolveCombinedScore)
                .max()
                .orElse(0));
        progression.setXp(
                (completedSessions.size() * COUPLE_GAME_COMPLETION_XP)
                        + (completedSessions.size() * COUPLE_CONSISTENCY_XP)
        );

        recalculateLevel(progression);
        try {
            progression = coupleProgressionRepository.saveAndFlush(progression);
        } catch (DataIntegrityViolationException ex) {
            log.debug("Couple progression bootstrap raced for coupleId={}, refetching existing row", couple.getId());
            return coupleProgressionRepository.findByCoupleIdForUpdate(couple.getId()).orElseThrow();
        }
        refreshCoupleStreak(couple, progression);
        evaluateCoupleAchievements(progression, new ArrayList<>());
        return coupleProgressionRepository.findByCoupleIdForUpdate(couple.getId()).orElse(progression);
    }

    private void recordDailyLogin(
            User user,
            UserProgression progression,
            List<ProgressionMilestoneDto> milestones
    ) {
        LocalDate today = LocalDate.now(resolveZoneId(user));
        if (today.equals(progression.getLastDailyLoginOn())) {
            return;
        }

        applyUserXpEvent(
                progression,
                "daily-login:" + today,
                ProgressionEvent.EventType.DAILY_LOGIN,
                USER_DAILY_LOGIN_XP,
                null,
                snapshot -> {
                    snapshot.setDailyLoginDays(snapshot.getDailyLoginDays() + 1);
                    snapshot.setLastDailyLoginOn(today);
                },
                milestones,
                true
        );
        evaluateUserAchievements(progression, milestones);
    }

    private void applyProfileCompletion(
            UserProgression progression,
            List<ProgressionMilestoneDto> milestones
    ) {
        applyUserXpEvent(
                progression,
                "profile-complete",
                ProgressionEvent.EventType.PROFILE_COMPLETION,
                USER_PROFILE_COMPLETION_XP,
                null,
                snapshot -> snapshot.setProfileCompleted(true),
                milestones,
                true
        );
    }

    private void refreshUserStreak(User user, UserProgression progression) {
        List<LocalDate> completionDates = gameSessionRepository.findAllByUserIdAndStatusOrderByCompletedAtDesc(
                user.getId(),
                GameSession.GameStatus.COMPLETED
        ).stream()
                .map(this::resolveSessionLocalDate)
                .filter(Objects::nonNull)
                .distinct()
                .sorted(Comparator.reverseOrder())
                .toList();

        progression.setCurrentStreakDays(calculateCurrentStreakDays(
                completionDates,
                LocalDate.now(resolveZoneId(user))
        ));
        progression.setLongestStreakDays(calculateLongestStreakDays(
                completionDates.stream().sorted().toList()
        ));
        userProgressionRepository.save(progression);
    }

    private void refreshCoupleStreak(Couple couple, CoupleProgression progression) {
        List<LocalDate> completionDates = gameSessionRepository.findByCouple_IdOrderByCreatedAtDesc(couple.getId())
                .stream()
                .filter(session -> session.getStatus() == GameSession.GameStatus.COMPLETED)
                .map(this::resolveSessionLocalDate)
                .filter(Objects::nonNull)
                .distinct()
                .sorted(Comparator.reverseOrder())
                .toList();

        progression.setCurrentStreakDays(calculateCurrentStreakDays(
                completionDates,
                LocalDate.now(resolveCoupleZoneId(couple))
        ));
        progression.setLongestStreakDays(calculateLongestStreakDays(
                completionDates.stream().sorted().toList()
        ));
        coupleProgressionRepository.save(progression);
    }

    private void evaluateUserAchievements(
            UserProgression progression,
            List<ProgressionMilestoneDto> milestones
    ) {
        Set<String> unlockedCodes = progressionEventRepository
                .findByScopeTypeAndScopeRefIdAndEventTypeOrderByCreatedAtDesc(
                        ProgressionEvent.ScopeType.USER,
                        progression.getUser().getId(),
                        ProgressionEvent.EventType.ACHIEVEMENT_UNLOCKED
                )
                .stream()
                .map(ProgressionEvent::getReferenceCode)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        boolean unlockedNewAchievement;
        do {
            unlockedNewAchievement = false;
            for (UserAchievementDefinition definition : buildUserAchievementCatalog()) {
                if (unlockedCodes.contains(definition.code()) || !definition.rule().test(progression)) {
                    continue;
                }
                applyUserXpEvent(
                        progression,
                        "achievement:" + definition.code().toLowerCase(Locale.ROOT),
                        ProgressionEvent.EventType.ACHIEVEMENT_UNLOCKED,
                        ACHIEVEMENT_UNLOCK_XP,
                        definition.code(),
                        snapshot -> { },
                        milestones,
                        true,
                        definition.title(),
                        definition.description()
                );
                unlockedCodes.add(definition.code());
                unlockedNewAchievement = true;
            }
        } while (unlockedNewAchievement);
    }

    private void evaluateCoupleAchievements(
            CoupleProgression progression,
            List<ProgressionMilestoneDto> milestones
    ) {
        Set<String> unlockedCodes = progressionEventRepository
                .findByScopeTypeAndScopeRefIdAndEventTypeOrderByCreatedAtDesc(
                        ProgressionEvent.ScopeType.COUPLE,
                        progression.getCouple().getId(),
                        ProgressionEvent.EventType.ACHIEVEMENT_UNLOCKED
                )
                .stream()
                .map(ProgressionEvent::getReferenceCode)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        boolean unlockedNewAchievement;
        do {
            unlockedNewAchievement = false;
            for (CoupleAchievementDefinition definition : buildCoupleAchievementCatalog()) {
                if (unlockedCodes.contains(definition.code()) || !definition.rule().test(progression)) {
                    continue;
                }
                applyCoupleXpEvent(
                        progression,
                        "achievement:" + definition.code().toLowerCase(Locale.ROOT),
                        ProgressionEvent.EventType.ACHIEVEMENT_UNLOCKED,
                        ACHIEVEMENT_UNLOCK_XP,
                        definition.code(),
                        snapshot -> { },
                        milestones,
                        true,
                        definition.title(),
                        definition.description()
                );
                unlockedCodes.add(definition.code());
                unlockedNewAchievement = true;
            }
        } while (unlockedNewAchievement);
    }

    private List<BadgeDto> getUserAchievements(UserProgression progression) {
        Map<String, Long> earnedAtByCode = progressionEventRepository
                .findByScopeTypeAndScopeRefIdAndEventTypeOrderByCreatedAtDesc(
                        ProgressionEvent.ScopeType.USER,
                        progression.getUser().getId(),
                        ProgressionEvent.EventType.ACHIEVEMENT_UNLOCKED
                )
                .stream()
                .filter(event -> event.getReferenceCode() != null)
                .collect(Collectors.toMap(
                        ProgressionEvent::getReferenceCode,
                        event -> event.getCreatedAt().toEpochMilli(),
                        (left, right) -> left,
                        LinkedHashMap::new
                ));

        return buildUserAchievementCatalog().stream()
                .filter(definition -> earnedAtByCode.containsKey(definition.code()))
                .map(definition -> BadgeDto.builder()
                        .code(definition.code())
                        .scope("USER")
                        .title(definition.title())
                        .description(definition.description())
                        .earnedAt(earnedAtByCode.get(definition.code()))
                        .build())
                .toList();
    }

    private List<BadgeDto> getCoupleAchievements(CoupleProgression progression) {
        Map<String, Long> earnedAtByCode = progressionEventRepository
                .findByScopeTypeAndScopeRefIdAndEventTypeOrderByCreatedAtDesc(
                        ProgressionEvent.ScopeType.COUPLE,
                        progression.getCouple().getId(),
                        ProgressionEvent.EventType.ACHIEVEMENT_UNLOCKED
                )
                .stream()
                .filter(event -> event.getReferenceCode() != null)
                .collect(Collectors.toMap(
                        ProgressionEvent::getReferenceCode,
                        event -> event.getCreatedAt().toEpochMilli(),
                        (left, right) -> left,
                        LinkedHashMap::new
                ));

        return buildCoupleAchievementCatalog().stream()
                .filter(definition -> earnedAtByCode.containsKey(definition.code()))
                .map(definition -> BadgeDto.builder()
                        .code(definition.code())
                        .scope("COUPLE")
                        .title(definition.title())
                        .description(definition.description())
                        .earnedAt(earnedAtByCode.get(definition.code()))
                        .build())
                .toList();
    }

    private List<UserAchievementDefinition> buildUserAchievementCatalog() {
        return List.of(
                new UserAchievementDefinition("PROFILE_READY", "Profile Ready", "Complete your profile with a bio and username.", snapshot -> snapshot.getProfileCompleted()),
                new UserAchievementDefinition("FIRST_GAME", "First Spark", "Complete your first game together.", snapshot -> snapshot.getGamesCompleted() >= 1),
                new UserAchievementDefinition("FIVE_GAMES", "Rhythm Builders", "Complete 5 games.", snapshot -> snapshot.getGamesCompleted() >= 5),
                new UserAchievementDefinition("TEN_GAMES", "Deeply In Sync", "Complete 10 games.", snapshot -> snapshot.getGamesCompleted() >= 10),
                new UserAchievementDefinition("SHARP_GUESSER", "Sharp Guesser", "Score at least 7 in a single game.", snapshot -> snapshot.getBestScore() >= 7),
                new UserAchievementDefinition("MATCH_WINNER", "Winning Instinct", "Win your first game.", snapshot -> snapshot.getGamesWon() >= 1),
                new UserAchievementDefinition("MIND_READER_25", "Mind Reader", "Make 25 correct guesses across games.", snapshot -> snapshot.getCorrectGuesses() >= 25),
                new UserAchievementDefinition("DAILY_DEVOTION_7", "Daily Devotion", "Check in on 7 different days.", snapshot -> snapshot.getDailyLoginDays() >= 7),
                new UserAchievementDefinition("STREAK_3", "Hot Streak", "Play on 3 consecutive days.", snapshot -> snapshot.getLongestStreakDays() >= 3),
                new UserAchievementDefinition("STREAK_7", "Unstoppable", "Play on 7 consecutive days.", snapshot -> snapshot.getLongestStreakDays() >= 7),
                new UserAchievementDefinition("LEVEL_5_USER", "Level Five", "Reach personal level 5.", snapshot -> snapshot.getLevel() >= 5),
                new UserAchievementDefinition("LEVEL_10_USER", "Level Ten", "Reach personal level 10.", snapshot -> snapshot.getLevel() >= 10)
        );
    }

    private List<CoupleAchievementDefinition> buildCoupleAchievementCatalog() {
        return List.of(
                new CoupleAchievementDefinition("COUPLE_FIRST_GAME", "Together, Started", "Complete your first game as a couple.", snapshot -> snapshot.getGamesCompleted() >= 1),
                new CoupleAchievementDefinition("COUPLE_FIVE_GAMES", "Shared Rhythm", "Complete 5 games together.", snapshot -> snapshot.getGamesCompleted() >= 5),
                new CoupleAchievementDefinition("COUPLE_TEN_GAMES", "Bonded By Play", "Complete 10 games together.", snapshot -> snapshot.getGamesCompleted() >= 10),
                new CoupleAchievementDefinition("COUPLE_STREAK_3", "Warm Momentum", "Maintain a 3-day couple streak.", snapshot -> snapshot.getLongestStreakDays() >= 3),
                new CoupleAchievementDefinition("COUPLE_STREAK_7", "Evergreen Streak", "Maintain a 7-day couple streak.", snapshot -> snapshot.getLongestStreakDays() >= 7),
                new CoupleAchievementDefinition("HEART_SYNC", "Heart Sync", "Average at least 12 combined points across 3 games.", this::hasHighAverageCombinedScore),
                new CoupleAchievementDefinition("PERFECT_PAIR", "Perfect Pair", "Reach a combined score of 15 or more in a single game.", snapshot -> snapshot.getBestCombinedScore() >= 15),
                new CoupleAchievementDefinition("LEVEL_5_COUPLE", "Couple Level Five", "Reach couple level 5.", snapshot -> snapshot.getLevel() >= 5),
                new CoupleAchievementDefinition("LEVEL_10_COUPLE", "Couple Level Ten", "Reach couple level 10.", snapshot -> snapshot.getLevel() >= 10)
        );
    }

    private boolean hasHighAverageCombinedScore(CoupleProgression progression) {
        if (progression.getGamesCompleted() < 3) {
            return false;
        }
        return (progression.getTotalCombinedScore() / (double) progression.getGamesCompleted()) >= 12.0;
    }

    private boolean applyUserXpEvent(
            UserProgression progression,
            String eventKey,
            ProgressionEvent.EventType eventType,
            long xpDelta,
            String referenceCode,
            Consumer<UserProgression> mutator,
            List<ProgressionMilestoneDto> milestones,
            boolean captureLevelUps
    ) {
        return applyUserXpEvent(
                progression,
                eventKey,
                eventType,
                xpDelta,
                referenceCode,
                mutator,
                milestones,
                captureLevelUps,
                null,
                null
        );
    }

    private boolean applyUserXpEvent(
            UserProgression progression,
            String eventKey,
            ProgressionEvent.EventType eventType,
            long xpDelta,
            String referenceCode,
            Consumer<UserProgression> mutator,
            List<ProgressionMilestoneDto> milestones,
            boolean captureLevelUps,
            String achievementTitle,
            String achievementDescription
    ) {
        UUID userId = progression.getUser().getId();
        ProgressionEvent event = createEvent(
                ProgressionEvent.ScopeType.USER,
                userId,
                eventType,
                eventKey,
                referenceCode,
                xpDelta
        );
        if (!tryReserveEvent(event)) {
            return false;
        }

        int previousLevel = progression.getLevel();
        mutator.accept(progression);
        progression.setXp(progression.getXp() + xpDelta);
        recalculateLevel(progression);
        userProgressionRepository.save(progression);

        if (achievementTitle != null && achievementDescription != null) {
            milestones.add(ProgressionMilestoneDto.builder()
                    .type("ACHIEVEMENT_UNLOCK")
                    .scope("USER")
                    .ownerLabel("You")
                    .code(referenceCode)
                    .title(achievementTitle)
                    .description(achievementDescription)
                    .earnedAt(event.getCreatedAt().toEpochMilli())
                    .xpDelta(xpDelta)
                    .build());
        }

        if (captureLevelUps && progression.getLevel() > previousLevel) {
            for (int level = previousLevel + 1; level <= progression.getLevel(); level++) {
                ProgressionEvent levelEvent = createEvent(
                        ProgressionEvent.ScopeType.USER,
                        userId,
                        ProgressionEvent.EventType.LEVEL_UP,
                        "level-up:" + level,
                        String.valueOf(level),
                        0L
                );
                boolean reserved = tryReserveEvent(levelEvent);
                long earnedAt = reserved && levelEvent.getCreatedAt() != null
                        ? levelEvent.getCreatedAt().toEpochMilli()
                        : event.getCreatedAt().toEpochMilli();
                milestones.add(ProgressionMilestoneDto.builder()
                        .type("LEVEL_UP")
                        .scope("USER")
                        .ownerLabel("You")
                        .title("Personal Level Up")
                        .description("You reached level " + level + ".")
                        .earnedAt(earnedAt)
                        .xpDelta(xpDelta)
                        .newLevel(level)
                        .build());
            }
        }

        return true;
    }

    private boolean applyCoupleXpEvent(
            CoupleProgression progression,
            String eventKey,
            ProgressionEvent.EventType eventType,
            long xpDelta,
            String referenceCode,
            Consumer<CoupleProgression> mutator,
            List<ProgressionMilestoneDto> milestones,
            boolean captureLevelUps
    ) {
        return applyCoupleXpEvent(
                progression,
                eventKey,
                eventType,
                xpDelta,
                referenceCode,
                mutator,
                milestones,
                captureLevelUps,
                null,
                null
        );
    }

    private boolean applyCoupleXpEvent(
            CoupleProgression progression,
            String eventKey,
            ProgressionEvent.EventType eventType,
            long xpDelta,
            String referenceCode,
            Consumer<CoupleProgression> mutator,
            List<ProgressionMilestoneDto> milestones,
            boolean captureLevelUps,
            String achievementTitle,
            String achievementDescription
    ) {
        UUID coupleId = progression.getCouple().getId();
        ProgressionEvent event = createEvent(
                ProgressionEvent.ScopeType.COUPLE,
                coupleId,
                eventType,
                eventKey,
                referenceCode,
                xpDelta
        );
        if (!tryReserveEvent(event)) {
            return false;
        }

        int previousLevel = progression.getLevel();
        mutator.accept(progression);
        progression.setXp(progression.getXp() + xpDelta);
        recalculateLevel(progression);
        coupleProgressionRepository.save(progression);

        if (achievementTitle != null && achievementDescription != null) {
            milestones.add(ProgressionMilestoneDto.builder()
                    .type("ACHIEVEMENT_UNLOCK")
                    .scope("COUPLE")
                    .ownerLabel(buildCoupleLabel(progression.getCouple()))
                    .code(referenceCode)
                    .title(achievementTitle)
                    .description(achievementDescription)
                    .earnedAt(event.getCreatedAt().toEpochMilli())
                    .xpDelta(xpDelta)
                    .build());
        }

        if (captureLevelUps && progression.getLevel() > previousLevel) {
            for (int level = previousLevel + 1; level <= progression.getLevel(); level++) {
                ProgressionEvent levelEvent = createEvent(
                        ProgressionEvent.ScopeType.COUPLE,
                        coupleId,
                        ProgressionEvent.EventType.LEVEL_UP,
                        "level-up:" + level,
                        String.valueOf(level),
                        0L
                );
                boolean reserved = tryReserveEvent(levelEvent);
                long earnedAt = reserved && levelEvent.getCreatedAt() != null
                        ? levelEvent.getCreatedAt().toEpochMilli()
                        : event.getCreatedAt().toEpochMilli();
                milestones.add(ProgressionMilestoneDto.builder()
                        .type("LEVEL_UP")
                        .scope("COUPLE")
                        .ownerLabel(buildCoupleLabel(progression.getCouple()))
                        .title("Couple Level Up")
                        .description("Your couple reached level " + level + ".")
                        .earnedAt(earnedAt)
                        .xpDelta(xpDelta)
                        .newLevel(level)
                        .build());
            }
        }

        return true;
    }

    private ProgressionEvent createEvent(
            ProgressionEvent.ScopeType scopeType,
            UUID scopeRefId,
            ProgressionEvent.EventType eventType,
            String eventKey,
            String referenceCode,
            long xpDelta
    ) {
        ProgressionEvent event = new ProgressionEvent();
        event.setScopeType(scopeType);
        event.setScopeRefId(scopeRefId);
        event.setEventType(eventType);
        event.setEventKey(eventKey);
        event.setReferenceCode(referenceCode);
        event.setXpDelta(xpDelta);
        return event;
    }

    private boolean tryReserveEvent(ProgressionEvent event) {
        try {
            progressionEventRepository.saveAndFlush(event);
            return true;
        } catch (DataIntegrityViolationException ex) {
            log.debug("Skipping duplicate progression event reservation: scope={}, ref={}, key={}",
                    event.getScopeType(), event.getScopeRefId(), event.getEventKey());
            return false;
        }
    }

    private void recalculateLevel(UserProgression progression) {
        progression.setLevel(resolveLevel(progression.getXp()));
    }

    private void recalculateLevel(CoupleProgression progression) {
        progression.setLevel(resolveLevel(progression.getXp()));
    }

    private int resolveLevel(long xp) {
        int level = 1;
        while (xp >= xpThresholdForLevel(level + 1)) {
            level++;
        }
        return level;
    }

    private long xpThresholdForLevel(int level) {
        if (level <= 1) {
            return 0L;
        }
        long threshold = 0L;
        for (int current = 1; current < level; current++) {
            threshold += 120L + ((long) (current - 1) * 40L);
        }
        return threshold;
    }

    private ProgressionSnapshotDto toSnapshotDto(
            String scope,
            String label,
            UserProgression progression,
            int achievementCount
    ) {
        long currentThreshold = xpThresholdForLevel(progression.getLevel());
        long nextThreshold = xpThresholdForLevel(progression.getLevel() + 1);
        long intoCurrent = progression.getXp() - currentThreshold;
        long neededForNext = nextThreshold - currentThreshold;
        long toNext = nextThreshold - progression.getXp();
        int progressPercent = neededForNext <= 0 ? 100 : (int) Math.min(100, Math.round((intoCurrent * 100.0) / neededForNext));

        return ProgressionSnapshotDto.builder()
                .scope(scope)
                .label(label)
                .xp(progression.getXp())
                .level(progression.getLevel())
                .xpIntoCurrentLevel(intoCurrent)
                .xpNeededForNextLevel(neededForNext)
                .xpToNextLevel(Math.max(0, toNext))
                .progressPercent(progressPercent)
                .currentStreakDays(progression.getCurrentStreakDays())
                .longestStreakDays(progression.getLongestStreakDays())
                .achievementsUnlocked(achievementCount)
                .build();
    }

    private ProgressionSnapshotDto toSnapshotDto(
            String scope,
            String label,
            CoupleProgression progression,
            int achievementCount
    ) {
        long currentThreshold = xpThresholdForLevel(progression.getLevel());
        long nextThreshold = xpThresholdForLevel(progression.getLevel() + 1);
        long intoCurrent = progression.getXp() - currentThreshold;
        long neededForNext = nextThreshold - currentThreshold;
        long toNext = nextThreshold - progression.getXp();
        int progressPercent = neededForNext <= 0 ? 100 : (int) Math.min(100, Math.round((intoCurrent * 100.0) / neededForNext));

        return ProgressionSnapshotDto.builder()
                .scope(scope)
                .label(label)
                .xp(progression.getXp())
                .level(progression.getLevel())
                .xpIntoCurrentLevel(intoCurrent)
                .xpNeededForNextLevel(neededForNext)
                .xpToNextLevel(Math.max(0, toNext))
                .progressPercent(progressPercent)
                .currentStreakDays(progression.getCurrentStreakDays())
                .longestStreakDays(progression.getLongestStreakDays())
                .achievementsUnlocked(achievementCount)
                .build();
    }

    private int countAchievementUnlocks(ProgressionEvent.ScopeType scopeType, UUID scopeRefId) {
        return progressionEventRepository.findByScopeTypeAndScopeRefIdAndEventTypeOrderByCreatedAtDesc(
                scopeType,
                scopeRefId,
                ProgressionEvent.EventType.ACHIEVEMENT_UNLOCKED
        ).size();
    }

    private ProgressionMilestoneDto toMilestoneDto(ProgressionEvent event, Couple activeCouple) {
        if (event.getEventType() == ProgressionEvent.EventType.ACHIEVEMENT_UNLOCKED) {
            return toAchievementMilestone(event, activeCouple);
        }
        if (event.getEventType() == ProgressionEvent.EventType.LEVEL_UP) {
            return toLevelMilestone(event, activeCouple);
        }
        return null;
    }

    private ProgressionMilestoneDto toAchievementMilestone(ProgressionEvent event, Couple activeCouple) {
        if (event.getReferenceCode() == null) {
            return null;
        }

        if (event.getScopeType() == ProgressionEvent.ScopeType.USER) {
            return buildUserAchievementCatalog().stream()
                    .filter(definition -> definition.code().equals(event.getReferenceCode()))
                    .findFirst()
                    .map(definition -> ProgressionMilestoneDto.builder()
                            .type("ACHIEVEMENT_UNLOCK")
                            .scope("USER")
                            .ownerLabel("You")
                            .code(definition.code())
                            .title(definition.title())
                            .description(definition.description())
                            .earnedAt(event.getCreatedAt().toEpochMilli())
                            .xpDelta(event.getXpDelta())
                            .build())
                    .orElse(null);
        }

        if (activeCouple == null) {
            return null;
        }

        return buildCoupleAchievementCatalog().stream()
                .filter(definition -> definition.code().equals(event.getReferenceCode()))
                .findFirst()
                .map(definition -> ProgressionMilestoneDto.builder()
                        .type("ACHIEVEMENT_UNLOCK")
                        .scope("COUPLE")
                        .ownerLabel(buildCoupleLabel(activeCouple))
                        .code(definition.code())
                        .title(definition.title())
                        .description(definition.description())
                        .earnedAt(event.getCreatedAt().toEpochMilli())
                        .xpDelta(event.getXpDelta())
                        .build())
                .orElse(null);
    }

    private ProgressionMilestoneDto toLevelMilestone(ProgressionEvent event, Couple activeCouple) {
        Integer level = parseLevelReference(event.getReferenceCode());
        if (level == null) {
            return null;
        }

        if (event.getScopeType() == ProgressionEvent.ScopeType.USER) {
            return ProgressionMilestoneDto.builder()
                    .type("LEVEL_UP")
                    .scope("USER")
                    .ownerLabel("You")
                    .title("Personal Level Up")
                    .description("You reached level " + level + ".")
                    .earnedAt(event.getCreatedAt().toEpochMilli())
                    .xpDelta(event.getXpDelta())
                    .newLevel(level)
                    .build();
        }

        if (activeCouple == null) {
            return null;
        }

        return ProgressionMilestoneDto.builder()
                .type("LEVEL_UP")
                .scope("COUPLE")
                .ownerLabel(buildCoupleLabel(activeCouple))
                .title("Couple Level Up")
                .description("Your couple reached level " + level + ".")
                .earnedAt(event.getCreatedAt().toEpochMilli())
                .xpDelta(event.getXpDelta())
                .newLevel(level)
                .build();
    }

    private Integer parseLevelReference(String referenceCode) {
        if (referenceCode == null || referenceCode.isBlank()) {
            return null;
        }
        try {
            return Integer.parseInt(referenceCode);
        } catch (NumberFormatException ex) {
            return null;
        }
    }

    private int resolveMyScore(GameSession session, UUID userId) {
        boolean isUser1 = session.getCouple().getUser1().getId().equals(userId);
        return isUser1
                ? Optional.ofNullable(session.getPlayer1Score()).orElse(0)
                : Optional.ofNullable(session.getPlayer2Score()).orElse(0);
    }

    private boolean didUserWin(GameSession session, UUID userId) {
        int myScore = resolveMyScore(session, userId);
        int partnerScore = session.getCouple().getUser1().getId().equals(userId)
                ? Optional.ofNullable(session.getPlayer2Score()).orElse(0)
                : Optional.ofNullable(session.getPlayer1Score()).orElse(0);
        return myScore > partnerScore;
    }

    private int resolveCombinedScore(GameSession session) {
        return Optional.ofNullable(session.getPlayer1Score()).orElse(0)
                + Optional.ofNullable(session.getPlayer2Score()).orElse(0);
    }

    private boolean hasAnsweredAllQuestions(UUID sessionId, UUID userId) {
        return gameAnswerRepository.findByGameSession_IdAndUser_IdOrderByQuestion_Id(sessionId, userId).size() >= QUESTIONS_PER_GAME;
    }

    private Optional<Couple> findActiveCouple(UUID userId) {
        List<Couple> couples = coupleRepository.findByUserIdAndStatusOrderByCreatedAtDesc(
                userId,
                Couple.RelationshipStatus.ACTIVE
        );
        if (couples.isEmpty()) {
            return Optional.empty();
        }
        return Optional.of(couples.get(0));
    }

    private ZoneId resolveZoneId(User user) {
        try {
            return ZoneId.of(Optional.ofNullable(user.getTimezone()).orElse("UTC"));
        } catch (Exception ex) {
            return ZoneId.of("UTC");
        }
    }

    private ZoneId resolveCoupleZoneId(Couple couple) {
        User anchorUser = couple.getUser1() != null ? couple.getUser1() : couple.getUser2();
        return anchorUser != null ? resolveZoneId(anchorUser) : ZoneId.of("UTC");
    }

    private LocalDate resolveLocalDate(User user, java.util.Date date) {
        if (date == null) {
            return null;
        }
        return date.toInstant().atZone(resolveZoneId(user)).toLocalDate();
    }

    private LocalDate resolveCoupleLocalDate(Couple couple, java.util.Date date) {
        User anchorUser = couple.getUser1() != null ? couple.getUser1() : couple.getUser2();
        if (anchorUser == null || date == null) {
            return null;
        }
        return resolveLocalDate(anchorUser, date);
    }

    private LocalDate resolveSessionLocalDate(GameSession session) {
        java.util.Date referenceDate = Optional.ofNullable(session.getCompletedAt()).orElse(session.getCreatedAt());
        return resolveCoupleLocalDate(session.getCouple(), referenceDate);
    }

    private int calculateCurrentStreakDays(List<LocalDate> completionDatesDesc, LocalDate today) {
        if (completionDatesDesc.isEmpty()) {
            return 0;
        }
        LocalDate latestCompletion = completionDatesDesc.get(0);
        if (latestCompletion.isBefore(today.minusDays(1))) {
            return 0;
        }
        int streak = 1;
        LocalDate expectedNext = latestCompletion.minusDays(1);
        for (int index = 1; index < completionDatesDesc.size(); index++) {
            LocalDate current = completionDatesDesc.get(index);
            if (!current.equals(expectedNext)) {
                break;
            }
            streak++;
            expectedNext = expectedNext.minusDays(1);
        }
        return streak;
    }

    private int calculateLongestStreakDays(List<LocalDate> completionDatesAsc) {
        if (completionDatesAsc.isEmpty()) {
            return 0;
        }
        int longest = 1;
        int current = 1;
        for (int index = 1; index < completionDatesAsc.size(); index++) {
            LocalDate previous = completionDatesAsc.get(index - 1);
            LocalDate next = completionDatesAsc.get(index);
            if (previous.plusDays(1).equals(next)) {
                current++;
                longest = Math.max(longest, current);
            } else {
                current = 1;
            }
        }
        return longest;
    }

    private boolean isProfileComplete(User user) {
        return user.getUsername() != null
                && !user.getUsername().isBlank()
                && user.getBio() != null
                && !user.getBio().isBlank();
    }

    private String buildCoupleLabel(Couple couple) {
        String user1 = couple.getUser1() != null ? couple.getUser1().getName() : "You";
        String user2 = couple.getUser2() != null ? couple.getUser2().getName() : "Partner";
        return user1 + " + " + user2;
    }

    private record UserAchievementDefinition(
            String code,
            String title,
            String description,
            Predicate<UserProgression> rule
    ) {}

    private record CoupleAchievementDefinition(
            String code,
            String title,
            String description,
            Predicate<CoupleProgression> rule
    ) {}

    public record GameCompletionProgressionResult(
            ProgressionSnapshotDto coupleProgression,
            List<ProgressionMilestoneDto> recentMilestones
    ) {}
}
