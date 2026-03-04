package com.onlyyours.service;

import com.onlyyours.dto.CoupleStatusDto;
import com.onlyyours.dto.CoupleDto;
import com.onlyyours.dto.UnlinkPreviewDto;
import com.onlyyours.dto.UserDto;
import com.onlyyours.model.Couple;
import com.onlyyours.model.GameSession;
import com.onlyyours.model.User;
import com.onlyyours.repository.CoupleRepository;
import com.onlyyours.repository.GameSessionRepository;
import com.onlyyours.repository.UserRepository;
import java.time.Duration;
import lombok.extern.slf4j.Slf4j;
import java.security.SecureRandom;
import java.util.Date;
import java.util.EnumSet;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Manages the couple linking lifecycle.
 *
 * A "couple" is a permanent two-way bond between two users, identified by a UUID.
 * The linking process uses a short-lived alphanumeric code:
 * 1. User A calls generateLinkCode() → a Couple record is created with user1=A and a random code
 * 2. User B calls redeemLinkCode(code) → user2 is set to B, code is nullified (one-time use)
 *
 * Business rules enforced:
 * - A user cannot redeem their own code (self-linking prevention)
 * - A code can only be redeemed once (user2 must be null)
 * - Invalid codes (non-existent or expired) return IllegalArgumentException
 */
@Service
@Slf4j
public class CoupleService {

    private final CoupleRepository coupleRepository;
    private final GameSessionRepository gameSessionRepository;
    private final UserRepository userRepository;
    private static final String ALPHANUM = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    private static final SecureRandom RANDOM = new SecureRandom();
    public static final String UNLINK_CONFIRMATION_TOKEN = "UNLINK_CONFIRM";
    private static final long COOLDOWN_DURATION_MILLIS = Duration.ofHours(24).toMillis();
    private static final EnumSet<GameSession.GameStatus> ACTIVE_GAME_STATUSES = EnumSet.of(
            GameSession.GameStatus.INVITED,
            GameSession.GameStatus.ROUND1,
            GameSession.GameStatus.ROUND2
    );

    public CoupleService(
            CoupleRepository coupleRepository,
            GameSessionRepository gameSessionRepository,
            UserRepository userRepository
    ) {
        this.coupleRepository = coupleRepository;
        this.gameSessionRepository = gameSessionRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public String generateLinkCode(UUID userId) {
        User user = requireUser(userId);
        assertUserCanLink(userId);

        List<Couple> pendingInvites = coupleRepository.findByUser1IdAndStatusOrderByCreatedAtDesc(
                userId,
                Couple.RelationshipStatus.PENDING
        );
        if (!pendingInvites.isEmpty()) {
            Couple pending = pendingInvites.get(0);
            pending.setLinkCode(randomCode(6));
            Couple refreshed = coupleRepository.save(pending);
            log.info("Existing pending link code refreshed for userId={}, coupleId={}", userId, refreshed.getId());
            return refreshed.getLinkCode();
        }

        Couple couple = new Couple();
        couple.setUser1(user);
        couple.setStatus(Couple.RelationshipStatus.PENDING);
        couple.setLinkCode(randomCode(6));
        couple.setCreatedAt(new Date());
        coupleRepository.save(couple);
        log.info("Link code generated for userId={} (code length={})", userId, couple.getLinkCode().length());
        return couple.getLinkCode();
    }

    @Transactional
    public Couple redeemLinkCode(UUID userId, String code) {
        User redeemer = requireUser(userId);
        assertUserCanLink(userId);

        String normalizedCode = code == null ? "" : code.trim().toUpperCase(Locale.ROOT);
        Optional<Couple> coupleOpt = coupleRepository.findByLinkCodeAndStatus(
                normalizedCode,
                Couple.RelationshipStatus.PENDING
        );
        Couple couple = coupleOpt.orElseThrow(() -> {
            log.warn("Invalid link code attempted by userId={}", userId);
            return new CoupleOperationException(
                    "INVALID_CODE",
                    HttpStatus.BAD_REQUEST,
                    "That link code is invalid or expired."
            );
        });

        if (couple.getUser2() != null) {
            log.warn("Already-used link code attempted by userId={}", userId);
            throw new CoupleOperationException(
                    "CODE_ALREADY_USED",
                    HttpStatus.CONFLICT,
                    "That link code was already used."
            );
        }
        if (couple.getUser1() != null && couple.getUser1().getId().equals(userId)) {
            log.warn("Self-link attempt rejected for userId={}", userId);
            throw new CoupleOperationException(
                    "SELF_LINK_NOT_ALLOWED",
                    HttpStatus.BAD_REQUEST,
                    "You cannot redeem your own code."
            );
        }

        couple.setUser2(redeemer);
        couple.setLinkCode(null);
        couple.setStatus(Couple.RelationshipStatus.ACTIVE);
        couple.setLinkedAt(new Date());
        couple.setUnlinkedAt(null);
        couple.setCooldownEndsAt(null);
        couple.setUnlinkedByUser(null);
        couple.setUnlinkReason(null);
        Couple saved = coupleRepository.save(couple);
        log.info("Couple linked successfully: coupleId={}, user1Id={}, user2Id={}",
                saved.getId(), saved.getUser1().getId(), saved.getUser2().getId());
        return saved;
    }

    public Optional<Couple> findCoupleForUser(UUID userId) {
        log.debug("Looking up couple for userId={}", userId);
        return findActiveCoupleForUser(userId);
    }

    public Optional<Couple> findActiveCoupleForUser(UUID userId) {
        return findLatestCoupleByStatus(userId, Couple.RelationshipStatus.ACTIVE);
    }

    public CoupleStatusDto getCoupleStatus(UUID userId) {
        Optional<Couple> activeCouple = findActiveCoupleForUser(userId);
        if (activeCouple.isPresent()) {
            return CoupleStatusDto.builder()
                    .status("LINKED")
                    .linked(true)
                    .canRecoverWithPreviousPartner(false)
                    .couple(toCoupleDto(activeCouple.get()))
                    .message("You are currently linked with your partner.")
                    .build();
        }

        Optional<Couple> unlinkedCouple = findLatestCoupleByStatus(userId, Couple.RelationshipStatus.UNLINKED);
        if (unlinkedCouple.isPresent() && isCooldownActive(unlinkedCouple.get(), new Date())) {
            Couple couple = unlinkedCouple.get();
            User partner = resolvePartner(couple, userId).orElse(null);
            return CoupleStatusDto.builder()
                    .status("COOLDOWN_ACTIVE")
                    .linked(false)
                    .unlinkedAt(toEpochMillis(couple.getUnlinkedAt()))
                    .cooldownEndsAt(toEpochMillis(couple.getCooldownEndsAt()))
                    .canRecoverWithPreviousPartner(partner != null)
                    .previousPartner(toUserDto(partner))
                    .message("You can recover this relationship during cooldown.")
                    .build();
        }

        return CoupleStatusDto.builder()
                .status("READY_TO_LINK")
                .linked(false)
                .canRecoverWithPreviousPartner(false)
                .message("You can generate or redeem a partner link code.")
                .build();
    }

    public UnlinkPreviewDto prepareUnlink(UUID userId) {
        Couple activeCouple = requireActiveCouple(userId);
        ensureNoActiveGameSession(activeCouple);
        User partner = resolvePartner(activeCouple, userId).orElse(null);

        return UnlinkPreviewDto.builder()
                .requiresConfirmation(true)
                .confirmationToken(UNLINK_CONFIRMATION_TOKEN)
                .cooldownDurationHours(24L)
                .partner(toUserDto(partner))
                .message("This will unlink your partner and start a 24-hour cooldown.")
                .build();
    }

    @Transactional
    public CoupleStatusDto unlinkCouple(UUID userId, String confirmationToken, String reason) {
        if (!UNLINK_CONFIRMATION_TOKEN.equals(confirmationToken)) {
            throw new CoupleOperationException(
                    "INVALID_CONFIRMATION",
                    HttpStatus.BAD_REQUEST,
                    "Missing or invalid unlink confirmation token."
            );
        }

        User actor = requireUser(userId);
        Couple activeCouple = requireActiveCouple(userId);
        ensureNoActiveGameSession(activeCouple);

        Date now = new Date();
        activeCouple.setStatus(Couple.RelationshipStatus.UNLINKED);
        activeCouple.setLinkCode(null);
        activeCouple.setUnlinkedAt(now);
        activeCouple.setCooldownEndsAt(new Date(now.getTime() + COOLDOWN_DURATION_MILLIS));
        activeCouple.setUnlinkedByUser(actor);
        activeCouple.setUnlinkReason(sanitizeUnlinkReason(reason));
        coupleRepository.save(activeCouple);

        log.info(
                "Couple unlinked: coupleId={}, byUser={}, cooldownEndsAt={}",
                activeCouple.getId(),
                userId,
                activeCouple.getCooldownEndsAt()
        );

        return getCoupleStatus(userId);
    }

    @Transactional
    public Couple recoverCouple(UUID userId) {
        if (findActiveCoupleForUser(userId).isPresent()) {
            throw new CoupleOperationException(
                    "COUPLE_ALREADY_LINKED",
                    HttpStatus.CONFLICT,
                    "You are already linked with a partner."
            );
        }

        Couple latestUnlinked = findLatestCoupleByStatus(userId, Couple.RelationshipStatus.UNLINKED)
                .orElseThrow(() -> new CoupleOperationException(
                        "RECOVERY_NOT_ALLOWED",
                        HttpStatus.CONFLICT,
                        "No recoverable relationship was found."
                ));

        Date now = new Date();
        if (!isCooldownActive(latestUnlinked, now)) {
            throw new CoupleOperationException(
                    "RECOVERY_NOT_ALLOWED",
                    HttpStatus.CONFLICT,
                    "Recovery is no longer available. Use a new link code."
            );
        }

        User partner = resolvePartner(latestUnlinked, userId).orElseThrow(() -> new CoupleOperationException(
                "RECOVERY_NOT_ALLOWED",
                HttpStatus.CONFLICT,
                "Recovery partner is unavailable."
        ));

        Optional<Couple> partnerActiveCouple = findActiveCoupleForUser(partner.getId());
        if (partnerActiveCouple.isPresent() && !partnerActiveCouple.get().getId().equals(latestUnlinked.getId())) {
            throw new CoupleOperationException(
                    "RECOVERY_NOT_ALLOWED",
                    HttpStatus.CONFLICT,
                    "Your previous partner is already linked elsewhere."
            );
        }

        latestUnlinked.setStatus(Couple.RelationshipStatus.ACTIVE);
        latestUnlinked.setLinkedAt(now);
        latestUnlinked.setUnlinkedAt(null);
        latestUnlinked.setCooldownEndsAt(null);
        latestUnlinked.setUnlinkedByUser(null);
        latestUnlinked.setUnlinkReason(null);
        Couple saved = coupleRepository.save(latestUnlinked);

        log.info("Couple recovered: coupleId={}, userId={}", saved.getId(), userId);
        return saved;
    }

    private String randomCode(int length) {
        StringBuilder sb = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            int idx = RANDOM.nextInt(ALPHANUM.length());
            sb.append(ALPHANUM.charAt(idx));
        }
        return sb.toString().toUpperCase(Locale.ROOT);
    }

    private User requireUser(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new CoupleOperationException(
                        "USER_NOT_FOUND",
                        HttpStatus.NOT_FOUND,
                        "User not found: " + userId
                ));
    }

    private Couple requireActiveCouple(UUID userId) {
        return findActiveCoupleForUser(userId)
                .orElseThrow(() -> new CoupleOperationException(
                        "COUPLE_NOT_LINKED",
                        HttpStatus.NOT_FOUND,
                        "No active partner link found."
                ));
    }

    private void assertUserCanLink(UUID userId) {
        if (findActiveCoupleForUser(userId).isPresent()) {
            throw new CoupleOperationException(
                    "COUPLE_ALREADY_LINKED",
                    HttpStatus.CONFLICT,
                    "You are already linked with a partner."
            );
        }

        Optional<Couple> latestUnlinked = findLatestCoupleByStatus(userId, Couple.RelationshipStatus.UNLINKED);
        if (latestUnlinked.isPresent() && isCooldownActive(latestUnlinked.get(), new Date())) {
            throw new CoupleOperationException(
                    "COOLDOWN_ACTIVE",
                    HttpStatus.TOO_MANY_REQUESTS,
                    "You are in a cooldown window. Recover previous link or try again later.",
                    java.util.Map.of(
                            "cooldownEndsAt",
                            toEpochMillis(latestUnlinked.get().getCooldownEndsAt())
                    )
            );
        }
    }

    private Optional<Couple> findLatestCoupleByStatus(UUID userId, Couple.RelationshipStatus status) {
        List<Couple> couples = coupleRepository.findByUserIdAndStatusOrderByCreatedAtDesc(userId, status);
        if (couples.isEmpty()) {
            return Optional.empty();
        }
        return Optional.of(couples.get(0));
    }

    private boolean isCooldownActive(Couple couple, Date now) {
        return couple.getCooldownEndsAt() != null && couple.getCooldownEndsAt().after(now);
    }

    private Optional<User> resolvePartner(Couple couple, UUID userId) {
        if (couple.getUser1() != null && couple.getUser1().getId().equals(userId)) {
            return Optional.ofNullable(couple.getUser2());
        }
        if (couple.getUser2() != null && couple.getUser2().getId().equals(userId)) {
            return Optional.ofNullable(couple.getUser1());
        }
        return Optional.empty();
    }

    private void ensureNoActiveGameSession(Couple couple) {
        List<GameSession> activeSessions = gameSessionRepository.findByCouple_IdAndStatusIn(
                couple.getId(),
                ACTIVE_GAME_STATUSES
        );
        if (activeSessions.isEmpty()) {
            return;
        }

        GameSession activeSession = activeSessions.get(0);
        throw new CoupleOperationException(
                "ACTIVE_SESSION_EXISTS",
                HttpStatus.CONFLICT,
                "Finish or expire your active game before unlinking.",
                java.util.Map.of(
                        "sessionId", activeSession.getId().toString(),
                        "sessionStatus", activeSession.getStatus().name()
                )
        );
    }

    private String sanitizeUnlinkReason(String reason) {
        if (reason == null) {
            return null;
        }
        String trimmed = reason.trim();
        if (trimmed.isEmpty()) {
            return null;
        }
        if (trimmed.length() <= 280) {
            return trimmed;
        }
        return trimmed.substring(0, 280);
    }

    private CoupleDto toCoupleDto(Couple couple) {
        return new CoupleDto(
                couple.getId(),
                toUserDto(couple.getUser1()),
                toUserDto(couple.getUser2())
        );
    }

    private UserDto toUserDto(User user) {
        if (user == null) {
            return null;
        }
        return UserDto.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .username(user.getUsername())
                .build();
    }

    private Long toEpochMillis(Date value) {
        return value == null ? null : value.getTime();
    }
}
