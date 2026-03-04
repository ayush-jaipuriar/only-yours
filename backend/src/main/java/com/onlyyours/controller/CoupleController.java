package com.onlyyours.controller;

import com.onlyyours.dto.CoupleDto;
import com.onlyyours.dto.CoupleStatusDto;
import com.onlyyours.dto.UnlinkPreviewDto;
import com.onlyyours.dto.UnlinkRequestDto;
import com.onlyyours.dto.UserDto;
import com.onlyyours.model.Couple;
import com.onlyyours.model.User;
import com.onlyyours.repository.UserRepository;
import com.onlyyours.service.CoupleService;
import com.onlyyours.service.PushNotificationService;
import java.security.Principal;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/couple")
public class CoupleController {

    private final CoupleService coupleService;
    private final UserRepository userRepository;
    private final PushNotificationService pushNotificationService;

    public CoupleController(CoupleService coupleService, UserRepository userRepository,
                            PushNotificationService pushNotificationService) {
        this.coupleService = coupleService;
        this.userRepository = userRepository;
        this.pushNotificationService = pushNotificationService;
    }

    @PostMapping("/generate-code")
    public ResponseEntity<Map<String, String>> generateCode(Principal principal) {
        UUID userId = getCurrentUserId(principal);
        String code = coupleService.generateLinkCode(userId);
        return ResponseEntity.ok(Map.of("code", code));
    }

    @PostMapping("/link")
    public ResponseEntity<CoupleDto> link(@RequestBody Map<String, String> body, Principal principal) {
        String code = body.get("code");
        if (code == null || code.isBlank()) {
            throw new IllegalArgumentException("Code is required");
        }
        UUID userId = getCurrentUserId(principal);
        Couple couple = coupleService.redeemLinkCode(userId, code.trim());

        User partner = couple.getUser1().getId().equals(userId)
                ? couple.getUser2() : couple.getUser1();
        User linker = couple.getUser1().getId().equals(userId)
                ? couple.getUser1() : couple.getUser2();
        pushNotificationService.sendToUser(
                partner.getId(),
                "Partner Linked!",
                linker.getName() + " just linked with you on Only Yours"
        );

        return ResponseEntity.ok(toDto(couple));
    }

    @GetMapping("")
    public ResponseEntity<CoupleDto> getCouple(Principal principal) {
        UUID userId = getCurrentUserId(principal);
        return coupleService.findCoupleForUser(userId)
                .map(c -> ResponseEntity.ok(toDto(c)))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/status")
    public ResponseEntity<CoupleStatusDto> getCoupleStatus(Principal principal) {
        UUID userId = getCurrentUserId(principal);
        return ResponseEntity.ok(coupleService.getCoupleStatus(userId));
    }

    @PostMapping("/unlink")
    public ResponseEntity<Object> unlink(Principal principal, @RequestBody(required = false) UnlinkRequestDto request) {
        UUID userId = getCurrentUserId(principal);
        String confirmationToken = request == null ? null : request.getConfirmationToken();

        if (confirmationToken == null || confirmationToken.isBlank()) {
            UnlinkPreviewDto preview = coupleService.prepareUnlink(userId);
            return ResponseEntity.ok(preview);
        }

        Couple coupleBeforeUnlink = coupleService.findActiveCoupleForUser(userId).orElse(null);
        CoupleStatusDto response = coupleService.unlinkCouple(
                userId,
                confirmationToken,
                request.getReason()
        );

        if (coupleBeforeUnlink != null) {
            User partner = coupleBeforeUnlink.getUser1().getId().equals(userId)
                    ? coupleBeforeUnlink.getUser2()
                    : coupleBeforeUnlink.getUser1();

            if (partner != null) {
                pushNotificationService.sendToUser(
                        partner.getId(),
                        "Relationship Unlinked",
                        "Your partner unlinked the relationship. You can recover this link for 24 hours.",
                        Map.of(
                                "type", "COUPLE_UNLINKED",
                                "targetRoute", "Settings"
                        )
                );
            }
        }

        return ResponseEntity.ok(response);
    }

    @PostMapping("/recover")
    public ResponseEntity<CoupleStatusDto> recover(Principal principal) {
        UUID userId = getCurrentUserId(principal);
        Couple recovered = coupleService.recoverCouple(userId);
        User partner = recovered.getUser1().getId().equals(userId)
                ? recovered.getUser2()
                : recovered.getUser1();

        if (partner != null) {
            User actor = recovered.getUser1().getId().equals(userId)
                    ? recovered.getUser1()
                    : recovered.getUser2();
            pushNotificationService.sendToUser(
                    partner.getId(),
                    "Relationship Recovered",
                    actor.getName() + " recovered your relationship link.",
                    Map.of(
                            "type", "COUPLE_RECOVERED",
                            "targetRoute", "Dashboard"
                    )
            );
        }

        return ResponseEntity.ok(coupleService.getCoupleStatus(userId));
    }

    private CoupleDto toDto(Couple couple) {
        User user1 = couple.getUser1();
        User user2 = couple.getUser2();
        return new CoupleDto(
                couple.getId(),
                toUserDto(user1),
                toUserDto(user2)
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

    private UUID getCurrentUserId(Principal principal) {
        String email = principal.getName();
        return userRepository.findByEmail(email).map(User::getId).orElseThrow();
    }
}


