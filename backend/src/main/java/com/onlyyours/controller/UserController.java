package com.onlyyours.controller;

import com.onlyyours.dto.NotificationPreferencesDto;
import com.onlyyours.dto.UpdateProfileRequestDto;
import com.onlyyours.dto.UserDto;
import com.onlyyours.model.User;
import com.onlyyours.repository.UserRepository;
import jakarta.validation.Valid;
import java.time.DateTimeException;
import java.time.ZoneId;
import java.security.Principal;
import java.util.Locale;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/user")
public class UserController {

    private final UserRepository userRepository;

    public UserController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping("/me")
    public ResponseEntity<UserDto> getMe(Principal principal) {
        User user = resolveCurrentUser(principal);
        return ResponseEntity.ok(toUserDto(user));
    }

    @PutMapping("/profile")
    public ResponseEntity<Object> updateProfile(
            @Valid @RequestBody UpdateProfileRequestDto request,
            Principal principal
    ) {
        User user = resolveCurrentUser(principal);

        if (request.getUsername() == null && request.getBio() == null) {
            return ResponseEntity.badRequest().body(Map.of(
                    "code", "PROFILE_UPDATE_EMPTY",
                    "message", "At least one profile field is required."
            ));
        }

        try {
            applyProfileUpdate(user, request);
            User saved = userRepository.save(user);
            return ResponseEntity.ok(toUserDto(saved));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(409).body(Map.of(
                    "code", "USERNAME_TAKEN",
                    "message", e.getMessage()
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "code", "PROFILE_UPDATE_INVALID",
                    "message", e.getMessage()
            ));
        }
    }

    @GetMapping("/preferences")
    public ResponseEntity<NotificationPreferencesDto> getNotificationPreferences(Principal principal) {
        User user = resolveCurrentUser(principal);
        return ResponseEntity.ok(toNotificationPreferencesDto(user));
    }

    @PutMapping("/preferences")
    public ResponseEntity<Object> updateNotificationPreferences(
            @Valid @RequestBody NotificationPreferencesDto request,
            Principal principal
    ) {
        User user = resolveCurrentUser(principal);
        try {
            applyNotificationPreferencesUpdate(user, request);
            User saved = userRepository.save(user);
            return ResponseEntity.ok(toNotificationPreferencesDto(saved));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "code", "NOTIFICATION_PREFERENCES_INVALID",
                    "message", e.getMessage()
            ));
        }
    }

    private void applyProfileUpdate(User user, UpdateProfileRequestDto request) {
        if (request.getUsername() != null) {
            String normalizedUsername = normalizeUsername(request.getUsername());
            if (normalizedUsername.isEmpty()) {
                throw new IllegalArgumentException("Username cannot be empty.");
            }
            if (!normalizedUsername.equals(user.getUsername())
                    && userRepository.existsByUsername(normalizedUsername)) {
                throw new IllegalStateException("Username is already in use.");
            }
            user.setUsername(normalizedUsername);
        }

        if (request.getBio() != null) {
            String normalizedBio = request.getBio().trim();
            user.setBio(normalizedBio.isEmpty() ? null : normalizedBio);
        }
    }

    private void applyNotificationPreferencesUpdate(User user, NotificationPreferencesDto request) {
        String timezone = request.getTimezone() == null ? "" : request.getTimezone().trim();
        try {
            ZoneId.of(timezone);
        } catch (DateTimeException ex) {
            throw new IllegalArgumentException("timezone must be a valid IANA timezone (e.g. Asia/Kolkata)");
        }

        user.setTimezone(timezone);
        user.setReminderTimeLocal(request.getReminderTimeLocal().trim());
        user.setQuietHoursStart(request.getQuietHoursStart().trim());
        user.setQuietHoursEnd(request.getQuietHoursEnd().trim());
    }

    private String normalizeUsername(String username) {
        return username == null ? "" : username.trim().toLowerCase(Locale.ROOT);
    }

    private User resolveCurrentUser(Principal principal) {
        String email = principal.getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + email));
    }

    private UserDto toUserDto(User user) {
        return UserDto.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .username(user.getUsername())
                .bio(user.getBio())
                .timezone(user.getTimezone())
                .reminderTimeLocal(user.getReminderTimeLocal())
                .quietHoursStart(user.getQuietHoursStart())
                .quietHoursEnd(user.getQuietHoursEnd())
                .build();
    }

    private NotificationPreferencesDto toNotificationPreferencesDto(User user) {
        return NotificationPreferencesDto.builder()
                .timezone(user.getTimezone())
                .reminderTimeLocal(user.getReminderTimeLocal())
                .quietHoursStart(user.getQuietHoursStart())
                .quietHoursEnd(user.getQuietHoursEnd())
                .build();
    }
}
