package com.onlyyours.service;

import com.onlyyours.model.Couple;
import com.onlyyours.model.User;
import com.onlyyours.repository.CoupleRepository;
import com.onlyyours.repository.UserRepository;
import java.security.SecureRandom;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
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
        User user = userRepository.findById(userId).orElseThrow(() -> new IllegalArgumentException("User not found"));

        // If user already part of a couple, return existing or block based on rules; for MVP, allow creating new if no active link
        Couple couple = new Couple();
        couple.setUser1(user);
        couple.setLinkCode(randomCode(6));
        coupleRepository.save(couple);
        return couple.getLinkCode();
    }

    @Transactional
    public Couple redeemLinkCode(UUID userId, String code) {
        User redeemer = userRepository.findById(userId).orElseThrow(() -> new IllegalArgumentException("User not found"));
        Optional<Couple> coupleOpt = coupleRepository.findByLinkCode(code);
        Couple couple = coupleOpt.orElseThrow(() -> new IllegalArgumentException("Invalid code"));

        if (couple.getUser2() != null) {
            throw new IllegalStateException("Code already used");
        }
        if (couple.getUser1() != null && couple.getUser1().getId().equals(userId)) {
            throw new IllegalArgumentException("Cannot redeem own code");
        }

        couple.setUser2(redeemer);
        couple.setLinkCode(null);
        return coupleRepository.save(couple);
    }

    public Optional<Couple> findCoupleForUser(UUID userId) {
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


