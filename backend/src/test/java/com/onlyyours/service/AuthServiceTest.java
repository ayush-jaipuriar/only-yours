package com.onlyyours.service;

import com.onlyyours.dto.AuthResponseDto;
import com.onlyyours.dto.LoginRequestDto;
import com.onlyyours.dto.RegisterRequestDto;
import com.onlyyours.model.PasswordResetToken;
import com.onlyyours.model.RefreshToken;
import com.onlyyours.model.User;
import com.onlyyours.repository.PasswordResetTokenRepository;
import com.onlyyours.repository.RefreshTokenRepository;
import com.onlyyours.repository.UserRepository;
import com.onlyyours.util.TokenHashUtil;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
class AuthServiceTest {

    @Autowired
    private AuthService authService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    @Autowired
    private PasswordResetTokenRepository passwordResetTokenRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Test
    void registerEmailUser_CreatesUserAndReturnsTokenPair() {
        RegisterRequestDto request = new RegisterRequestDto("alice", "alice@test.com", "password123");

        AuthResponseDto response = authService.registerEmailUser(request);

        assertNotNull(response.getAccessToken());
        assertNotNull(response.getRefreshToken());
        assertEquals(900, response.getExpiresInSeconds());
        assertNotNull(response.getUser());
        assertEquals("alice", response.getUser().getUsername());
        assertEquals("alice@test.com", response.getUser().getEmail());

        User savedUser = userRepository.findByEmail("alice@test.com").orElseThrow();
        assertTrue(passwordEncoder.matches("password123", savedUser.getPasswordHash()));
        assertEquals(User.AuthProvider.EMAIL_PASSWORD, savedUser.getAuthProvider());
    }

    @Test
    void registerEmailUser_DuplicateEmailRejected() {
        authService.registerEmailUser(new RegisterRequestDto("alice", "alice@test.com", "password123"));

        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> authService.registerEmailUser(new RegisterRequestDto("alice2", "alice@test.com", "password123"))
        );

        assertEquals("Registration failed", exception.getMessage());
    }

    @Test
    void loginEmailUser_InvalidPasswordRejected() {
        User user = new User();
        user.setEmail("bob@test.com");
        user.setUsername("bob");
        user.setName("Bob");
        user.setPasswordHash(passwordEncoder.encode("password123"));
        user.setAuthProvider(User.AuthProvider.EMAIL_PASSWORD);
        userRepository.save(user);

        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> authService.loginEmailUser(new LoginRequestDto("bob@test.com", "wrong-password"))
        );

        assertEquals("Invalid credentials", exception.getMessage());
    }

    @Test
    void refreshAccessToken_RotatesRefreshToken() {
        AuthResponseDto firstPair = authService.registerEmailUser(
                new RegisterRequestDto("carol", "carol@test.com", "password123")
        );

        AuthResponseDto refreshedPair = authService.refreshAccessToken(firstPair.getRefreshToken());

        assertNotNull(refreshedPair.getAccessToken());
        assertNotNull(refreshedPair.getRefreshToken());
        assertNotEquals(firstPair.getRefreshToken(), refreshedPair.getRefreshToken());

        String oldTokenHash = TokenHashUtil.hashToken(firstPair.getRefreshToken());
        RefreshToken oldToken = refreshTokenRepository.findByTokenHash(oldTokenHash).orElseThrow();
        assertNotNull(oldToken.getRevokedAt(), "Old refresh token should be revoked after rotation");
    }

    @Test
    void requestPasswordReset_UnknownEmailStillReturnsGenericMessage() {
        String response = authService.requestPasswordReset("unknown@test.com");
        assertEquals("If an account with that email exists, a password reset link has been sent.", response);
    }

    @Test
    void resetPassword_UsesTokenOnce_UpdatesPassword_RevokesRefreshTokens() {
        User user = new User();
        user.setEmail("dana@test.com");
        user.setUsername("dana");
        user.setName("Dana");
        user.setPasswordHash(passwordEncoder.encode("oldpassword123"));
        user.setAuthProvider(User.AuthProvider.EMAIL_PASSWORD);
        user = userRepository.save(user);

        AuthResponseDto loginPair = authService.loginEmailUser(new LoginRequestDto("dana@test.com", "oldpassword123"));

        String rawResetToken = UUID.randomUUID().toString();
        PasswordResetToken resetToken = new PasswordResetToken();
        resetToken.setUser(user);
        resetToken.setTokenHash(TokenHashUtil.hashToken(rawResetToken));
        resetToken.setExpiresAt(Instant.now().plus(1, ChronoUnit.HOURS));
        passwordResetTokenRepository.save(resetToken);

        String result = authService.resetPassword(rawResetToken, "newpassword123");

        assertEquals("Password has been reset successfully", result);
        User updatedUser = userRepository.findByEmail("dana@test.com").orElseThrow();
        assertTrue(passwordEncoder.matches("newpassword123", updatedUser.getPasswordHash()));

        PasswordResetToken usedToken = passwordResetTokenRepository.findByTokenHash(TokenHashUtil.hashToken(rawResetToken))
                .orElseThrow();
        assertNotNull(usedToken.getUsedAt(), "Reset token should be marked used");

        RefreshToken oldRefreshToken = refreshTokenRepository.findByTokenHash(TokenHashUtil.hashToken(loginPair.getRefreshToken()))
                .orElseThrow();
        assertNotNull(oldRefreshToken.getRevokedAt(), "Existing refresh token should be revoked after password reset");
    }
}
