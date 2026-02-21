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
import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Collections;
import java.util.Locale;
import java.util.UUID;

@Service
@Slf4j
public class AuthService implements UserDetailsService {

    private static final String INVALID_CREDENTIALS_MESSAGE = "Invalid credentials";
    private static final String GENERIC_REGISTRATION_ERROR_MESSAGE = "Registration failed";
    private static final String INVALID_REFRESH_TOKEN_MESSAGE = "Invalid refresh token";
    private static final String GENERIC_FORGOT_PASSWORD_MESSAGE =
            "If an account with that email exists, a password reset link has been sent.";
    private static final String INVALID_RESET_TOKEN_MESSAGE = "Invalid or expired reset token";

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;

    @Value("${google.client.id:}")
    private String googleClientId;

    public AuthService(
            UserRepository userRepository,
            RefreshTokenRepository refreshTokenRepository,
            PasswordResetTokenRepository passwordResetTokenRepository,
            JwtService jwtService,
            PasswordEncoder passwordEncoder
    ) {
        this.userRepository = userRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.jwtService = jwtService;
        this.passwordEncoder = passwordEncoder;
    }

    /**
     * Legacy endpoint retained for backward code compatibility.
     * Google auth is intentionally disabled in Phase 1 migration.
     */
    public AuthResponseDto authenticateGoogleUser(String idTokenString) {
        log.warn(
                "Google sign-in attempted while disabled. tokenPresent={}, clientIdConfigured={}",
                idTokenString != null && !idTokenString.isBlank(),
                googleClientId != null && !googleClientId.isBlank()
        );
        throw new IllegalArgumentException("Google sign-in is temporarily disabled");
    }

    @Transactional
    public AuthResponseDto registerEmailUser(RegisterRequestDto request) {
        String email = normalizeEmail(request.getEmail());
        String username = normalizeUsername(request.getUsername());

        if (userRepository.existsByEmail(email) || userRepository.existsByUsername(username)) {
            throw new IllegalArgumentException(GENERIC_REGISTRATION_ERROR_MESSAGE);
        }

        User user = new User();
        user.setEmail(email);
        user.setUsername(username);
        user.setName(username);
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setGoogleUserId(null);
        user.setAuthProvider(User.AuthProvider.EMAIL_PASSWORD);
        User savedUser = userRepository.save(user);

        log.info("Email/password user registered: userId={}, email={}", savedUser.getId(), savedUser.getEmail());
        return issueAccessAndRefreshTokens(savedUser);
    }

    @Transactional
    public AuthResponseDto loginEmailUser(LoginRequestDto request) {
        String email = normalizeEmail(request.getEmail());
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException(INVALID_CREDENTIALS_MESSAGE));

        if (user.getAuthProvider() != User.AuthProvider.EMAIL_PASSWORD
                || user.getPasswordHash() == null
                || !passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new IllegalArgumentException(INVALID_CREDENTIALS_MESSAGE);
        }

        log.info("Email/password user logged in: userId={}", user.getId());
        return issueAccessAndRefreshTokens(user);
    }

    @Transactional
    public AuthResponseDto refreshAccessToken(String rawRefreshToken) {
        String tokenHash = TokenHashUtil.hashToken(rawRefreshToken);
        RefreshToken existingToken = refreshTokenRepository.findByTokenHash(tokenHash)
                .orElseThrow(() -> new IllegalArgumentException(INVALID_REFRESH_TOKEN_MESSAGE));

        if (!existingToken.isUsable()) {
            throw new IllegalArgumentException(INVALID_REFRESH_TOKEN_MESSAGE);
        }

        existingToken.setRevokedAt(Instant.now());
        refreshTokenRepository.save(existingToken);

        log.debug("Refresh token rotated: tokenId={}, userId={}", existingToken.getId(), existingToken.getUser().getId());
        return issueAccessAndRefreshTokens(existingToken.getUser());
    }

    @Transactional
    public void revokeRefreshToken(String rawRefreshToken) {
        if (rawRefreshToken == null || rawRefreshToken.isBlank()) {
            return;
        }

        String tokenHash = TokenHashUtil.hashToken(rawRefreshToken);
        refreshTokenRepository.findByTokenHash(tokenHash).ifPresent(token -> {
            if (token.getRevokedAt() == null) {
                token.setRevokedAt(Instant.now());
                refreshTokenRepository.save(token);
                log.info("Refresh token revoked: tokenId={}, userId={}", token.getId(), token.getUser().getId());
            }
        });
    }

    @Transactional
    public String requestPasswordReset(String emailInput) {
        String email = normalizeEmail(emailInput);
        User user = userRepository.findByEmail(email).orElse(null);

        if (user == null) {
            log.info("Password reset requested for unknown email. Returning generic response.");
            return GENERIC_FORGOT_PASSWORD_MESSAGE;
        }

        Instant now = Instant.now();
        passwordResetTokenRepository.invalidateAllByUser(user, now);

        String rawResetToken = UUID.randomUUID().toString();
        String tokenHash = TokenHashUtil.hashToken(rawResetToken);

        PasswordResetToken resetToken = new PasswordResetToken();
        resetToken.setUser(user);
        resetToken.setTokenHash(tokenHash);
        resetToken.setExpiresAt(now.plus(1, ChronoUnit.HOURS));
        passwordResetTokenRepository.save(resetToken);

        // Dev-only token delivery path. Production should integrate an email provider.
        log.info("DEV ONLY - Password reset token for email {}: {}", email, rawResetToken);
        return GENERIC_FORGOT_PASSWORD_MESSAGE;
    }

    @Transactional
    public String resetPassword(String rawToken, String newPassword) {
        String tokenHash = TokenHashUtil.hashToken(rawToken);
        PasswordResetToken resetToken = passwordResetTokenRepository.findByTokenHash(tokenHash)
                .orElseThrow(() -> new IllegalArgumentException(INVALID_RESET_TOKEN_MESSAGE));

        if (!resetToken.isUsable()) {
            throw new IllegalArgumentException(INVALID_RESET_TOKEN_MESSAGE);
        }

        User user = resetToken.getUser();
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        user.setAuthProvider(User.AuthProvider.EMAIL_PASSWORD);
        if (user.getUsername() == null || user.getUsername().isBlank()) {
            user.setUsername(user.getEmail());
        }
        if (user.getName() == null || user.getName().isBlank()) {
            user.setName(user.getUsername());
        }
        userRepository.save(user);

        Instant now = Instant.now();
        resetToken.setUsedAt(now);
        passwordResetTokenRepository.save(resetToken);
        refreshTokenRepository.revokeAllByUser(user, now);

        log.info("Password reset completed for userId={}", user.getId());
        return "Password has been reset successfully";
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        String email = normalizeEmail(username);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        return buildUserDetails(user);
    }

    private AuthResponseDto issueAccessAndRefreshTokens(User user) {
        UserDetails userDetails = buildUserDetails(user);
        String accessToken = jwtService.generateToken(userDetails);

        String rawRefreshToken = UUID.randomUUID().toString();
        String refreshTokenHash = TokenHashUtil.hashToken(rawRefreshToken);

        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setUser(user);
        refreshToken.setTokenHash(refreshTokenHash);
        refreshToken.setExpiresAt(Instant.now().plus(30, ChronoUnit.DAYS));
        refreshTokenRepository.save(refreshToken);

        return AuthResponseDto.builder()
                .accessToken(accessToken)
                .refreshToken(rawRefreshToken)
                .expiresInSeconds(jwtService.getAccessTokenExpirySeconds())
                .user(
                        AuthResponseDto.AuthUserDto.builder()
                                .id(user.getId())
                                .username(user.getUsername())
                                .email(user.getEmail())
                                .build()
                )
                .build();
    }

    private UserDetails buildUserDetails(User user) {
        String password = user.getPasswordHash() == null ? "" : user.getPasswordHash();
        return new org.springframework.security.core.userdetails.User(
                user.getEmail(),
                password,
                Collections.emptyList()
        );
    }

    private String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
    }

    private String normalizeUsername(String username) {
        return username == null ? "" : username.trim().toLowerCase(Locale.ROOT);
    }
}