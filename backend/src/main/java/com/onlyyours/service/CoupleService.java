package com.onlyyours.service;

import com.onlyyours.model.Couple;
import com.onlyyours.model.User;
import com.onlyyours.repository.CoupleRepository;
import com.onlyyours.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import java.security.SecureRandom;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;
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
    private final UserRepository userRepository;
    private static final String ALPHANUM = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    private static final SecureRandom RANDOM = new SecureRandom();

    public CoupleService(CoupleRepository coupleRepository, UserRepository userRepository) {
        this.coupleRepository = coupleRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public String generateLinkCode(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

        Couple couple = new Couple();
        couple.setUser1(user);
        couple.setLinkCode(randomCode(6));
        coupleRepository.save(couple);
        log.info("Link code generated for userId={} (code length={})", userId, couple.getLinkCode().length());
        return couple.getLinkCode();
    }

    @Transactional
    public Couple redeemLinkCode(UUID userId, String code) {
        User redeemer = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

        Optional<Couple> coupleOpt = coupleRepository.findByLinkCode(code);
        Couple couple = coupleOpt.orElseThrow(() -> {
            log.warn("Invalid link code attempted by userId={}", userId);
            return new IllegalArgumentException("Invalid code");
        });

        if (couple.getUser2() != null) {
            log.warn("Already-used link code attempted by userId={}", userId);
            throw new IllegalStateException("Code already used");
        }
        if (couple.getUser1() != null && couple.getUser1().getId().equals(userId)) {
            log.warn("Self-link attempt rejected for userId={}", userId);
            throw new IllegalArgumentException("Cannot redeem own code");
        }

        couple.setUser2(redeemer);
        couple.setLinkCode(null);
        Couple saved = coupleRepository.save(couple);
        log.info("Couple linked successfully: coupleId={}, user1Id={}, user2Id={}",
                saved.getId(), saved.getUser1().getId(), saved.getUser2().getId());
        return saved;
    }

    public Optional<Couple> findCoupleForUser(UUID userId) {
        log.debug("Looking up couple for userId={}", userId);
        return coupleRepository.findByUser1_IdOrUser2_Id(userId, userId);
    }

    private String randomCode(int length) {
        StringBuilder sb = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            int idx = RANDOM.nextInt(ALPHANUM.length());
            sb.append(ALPHANUM.charAt(idx));
        }
        return sb.toString().toUpperCase(Locale.ROOT);
    }
}


