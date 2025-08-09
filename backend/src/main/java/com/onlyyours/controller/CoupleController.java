package com.onlyyours.controller;

import com.onlyyours.dto.CoupleDto;
import com.onlyyours.dto.UserDto;
import com.onlyyours.model.Couple;
import com.onlyyours.model.User;
import com.onlyyours.repository.UserRepository;
import com.onlyyours.service.CoupleService;
import java.security.Principal;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.HttpStatus;
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

    public CoupleController(CoupleService coupleService, UserRepository userRepository) {
        this.coupleService = coupleService;
        this.userRepository = userRepository;
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
            return ResponseEntity.badRequest().build();
        }
        UUID userId = getCurrentUserId(principal);
        Couple couple = coupleService.redeemLinkCode(userId, code.trim());
        return ResponseEntity.ok(toDto(couple));
    }

    @GetMapping("")
    public ResponseEntity<CoupleDto> getCouple(Principal principal) {
        UUID userId = getCurrentUserId(principal);
        return coupleService.findCoupleForUser(userId)
                .map(c -> ResponseEntity.ok(toDto(c)))
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).build());
    }

    private CoupleDto toDto(Couple couple) {
        User user1 = couple.getUser1();
        User user2 = couple.getUser2();
        return new CoupleDto(
                couple.getId(),
                user1 != null ? new UserDto(user1.getId(), user1.getName(), user1.getEmail()) : null,
                user2 != null ? new UserDto(user2.getId(), user2.getName(), user2.getEmail()) : null
        );
    }

    private UUID getCurrentUserId(Principal principal) {
        String email = principal.getName();
        return userRepository.findByEmail(email).map(User::getId).orElseThrow();
    }
}


