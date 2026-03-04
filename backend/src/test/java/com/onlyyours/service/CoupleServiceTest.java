package com.onlyyours.service;

import com.onlyyours.model.Couple;
import com.onlyyours.model.GameSession;
import com.onlyyours.model.User;
import com.onlyyours.repository.CoupleRepository;
import com.onlyyours.repository.GameSessionRepository;
import com.onlyyours.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
class CoupleServiceTest {

    @Autowired private CoupleService coupleService;
    @Autowired private UserRepository userRepo;
    @Autowired private CoupleRepository coupleRepo;
    @Autowired private GameSessionRepository gameSessionRepo;

    private User userA, userB;

    @BeforeEach
    void setUp() {
        userA = new User();
        userA.setEmail("alice@test.com");
        userA.setName("Alice");
        userA.setGoogleUserId("google-alice");
        userA = userRepo.save(userA);

        userB = new User();
        userB.setEmail("bob@test.com");
        userB.setName("Bob");
        userB.setGoogleUserId("google-bob");
        userB = userRepo.save(userB);
    }

    @Test
    void testGenerateLinkCode_ReturnsNonEmptyCode() {
        String code = coupleService.generateLinkCode(userA.getId());

        assertNotNull(code);
        assertEquals(6, code.length());
        assertTrue(code.matches("[A-Z0-9]+"), "Code should be uppercase alphanumeric");
    }

    @Test
    void testGenerateLinkCode_CreatesCouple() {
        String code = coupleService.generateLinkCode(userA.getId());

        Optional<Couple> couple = coupleRepo.findByLinkCode(code);
        assertTrue(couple.isPresent());
        assertEquals(userA.getId(), couple.get().getUser1().getId());
        assertNull(couple.get().getUser2(), "User2 should be null until code redeemed");
    }

    @Test
    void testRedeemLinkCode_LinksUsers() {
        String code = coupleService.generateLinkCode(userA.getId());

        Couple couple = coupleService.redeemLinkCode(userB.getId(), code);

        assertNotNull(couple);
        assertEquals(userA.getId(), couple.getUser1().getId());
        assertEquals(userB.getId(), couple.getUser2().getId());
        assertNull(couple.getLinkCode(), "Code should be cleared after redemption");
    }

    @Test
    void testRedeemLinkCode_InvalidCodeThrows() {
        CoupleOperationException ex = assertThrows(CoupleOperationException.class, () ->
            coupleService.redeemLinkCode(userB.getId(), "INVALID"));
        assertEquals("INVALID_CODE", ex.getCode());
    }

    @Test
    void testRedeemLinkCode_SelfRedeemThrows() {
        String code = coupleService.generateLinkCode(userA.getId());

        CoupleOperationException ex = assertThrows(CoupleOperationException.class, () ->
            coupleService.redeemLinkCode(userA.getId(), code));
        assertEquals("SELF_LINK_NOT_ALLOWED", ex.getCode());
    }

    @Test
    void testRedeemLinkCode_AlreadyUsedCodeThrows() {
        String code = coupleService.generateLinkCode(userA.getId());
        coupleService.redeemLinkCode(userB.getId(), code);

        User userC = new User();
        userC.setEmail("charlie@test.com");
        userC.setName("Charlie");
        userC.setGoogleUserId("google-charlie");
        userC = userRepo.save(userC);

        final User savedC = userC;
        CoupleOperationException ex = assertThrows(CoupleOperationException.class, () ->
            coupleService.redeemLinkCode(savedC.getId(), code));
        assertEquals("INVALID_CODE", ex.getCode());
    }

    @Test
    void testFindCoupleForUser_ReturnsLinkedCouple() {
        String code = coupleService.generateLinkCode(userA.getId());
        coupleService.redeemLinkCode(userB.getId(), code);

        Optional<Couple> forA = coupleService.findCoupleForUser(userA.getId());
        Optional<Couple> forB = coupleService.findCoupleForUser(userB.getId());

        assertTrue(forA.isPresent());
        assertTrue(forB.isPresent());
        assertEquals(forA.get().getId(), forB.get().getId());
    }

    @Test
    void testFindCoupleForUser_UnlinkedUserReturnsEmpty() {
        User solo = new User();
        solo.setEmail("solo@test.com");
        solo.setName("Solo");
        solo.setGoogleUserId("google-solo");
        solo = userRepo.save(solo);

        Optional<Couple> result = coupleService.findCoupleForUser(solo.getId());
        assertFalse(result.isPresent());
    }

    @Test
    void testGenerateLinkCode_InvalidUserThrows() {
        CoupleOperationException ex = assertThrows(CoupleOperationException.class, () ->
            coupleService.generateLinkCode(java.util.UUID.randomUUID()));
        assertEquals("USER_NOT_FOUND", ex.getCode());
    }

    @Test
    void testPrepareUnlink_BlockedWhenActiveGameExists() {
        String code = coupleService.generateLinkCode(userA.getId());
        Couple linked = coupleService.redeemLinkCode(userB.getId(), code);

        GameSession activeSession = new GameSession();
        activeSession.setCouple(linked);
        activeSession.setStatus(GameSession.GameStatus.INVITED);
        activeSession.setCreatedAt(new java.util.Date());
        gameSessionRepo.save(activeSession);

        CoupleOperationException ex = assertThrows(
                CoupleOperationException.class,
                () -> coupleService.prepareUnlink(userA.getId())
        );
        assertEquals("ACTIVE_SESSION_EXISTS", ex.getCode());
    }

    @Test
    void testUnlinkAndRecoverDuringCooldownFlow() {
        String code = coupleService.generateLinkCode(userA.getId());
        coupleService.redeemLinkCode(userB.getId(), code);

        var preview = coupleService.prepareUnlink(userA.getId());
        assertTrue(preview.isRequiresConfirmation());
        assertEquals(CoupleService.UNLINK_CONFIRMATION_TOKEN, preview.getConfirmationToken());

        var statusAfterUnlink = coupleService.unlinkCouple(
                userA.getId(),
                CoupleService.UNLINK_CONFIRMATION_TOKEN,
                "Test unlink reason"
        );
        assertEquals("COOLDOWN_ACTIVE", statusAfterUnlink.getStatus());
        assertFalse(statusAfterUnlink.isLinked());
        assertTrue(statusAfterUnlink.isCanRecoverWithPreviousPartner());

        CoupleOperationException cooldownEx = assertThrows(
                CoupleOperationException.class,
                () -> coupleService.generateLinkCode(userA.getId())
        );
        assertEquals("COOLDOWN_ACTIVE", cooldownEx.getCode());

        Couple recovered = coupleService.recoverCouple(userA.getId());
        assertEquals(Couple.RelationshipStatus.ACTIVE, recovered.getStatus());
        assertTrue(coupleService.findCoupleForUser(userA.getId()).isPresent());
    }
}
