package com.onlyyours.integration;

import com.onlyyours.model.PasswordResetToken;
import com.onlyyours.model.User;
import com.onlyyours.repository.PasswordResetTokenRepository;
import com.onlyyours.repository.UserRepository;
import com.onlyyours.util.TokenHashUtil;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AuthSecurityNegativeTest extends BaseIntegrationTest {

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private UserRepository userRepo;

    @Autowired
    private PasswordResetTokenRepository resetTokenRepo;

    @Test
    void login_UnknownEmailAndWrongPassword_UseSameGenericMessage() throws Exception {
        User user = new User();
        user.setEmail("secure@test.com");
        user.setUsername("secure");
        user.setName("Secure");
        user.setPasswordHash(passwordEncoder.encode("password123"));
        user.setAuthProvider(User.AuthProvider.EMAIL_PASSWORD);
        userRepo.save(user);

        String unknownEmailResponse = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "unknown@test.com",
                                  "password": "password123"
                                }
                                """))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Invalid credentials"))
                .andReturn()
                .getResponse()
                .getContentAsString();

        String wrongPasswordResponse = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "secure@test.com",
                                  "password": "wrong-password"
                                }
                                """))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Invalid credentials"))
                .andReturn()
                .getResponse()
                .getContentAsString();

        assertEquals(unknownEmailResponse, wrongPasswordResponse);
    }

    @Test
    void userMe_WithTamperedAccessToken_IsRejected() throws Exception {
        User user = new User();
        user.setEmail("tamper@test.com");
        user.setUsername("tamper");
        user.setName("Tamper");
        user.setGoogleUserId("google-tamper");
        user = userRepo.save(user);

        String validToken = createJwtFor(user);
        String[] jwtParts = validToken.split("\\.");
        String tamperedToken = jwtParts[0] + "." + jwtParts[1] + ".tampered-signature";

        mockMvc.perform(get("/api/user/me")
                        .header("Authorization", "Bearer " + tamperedToken))
                .andExpect(status().is4xxClientError());
    }

    @Test
    void resetPassword_ReplayedToken_IsRejected() throws Exception {
        User user = new User();
        user.setEmail("replay@test.com");
        user.setUsername("replay");
        user.setName("Replay");
        user.setPasswordHash(passwordEncoder.encode("password123"));
        user.setAuthProvider(User.AuthProvider.EMAIL_PASSWORD);
        user = userRepo.save(user);

        String rawToken = UUID.randomUUID().toString();
        PasswordResetToken resetToken = new PasswordResetToken();
        resetToken.setUser(user);
        resetToken.setTokenHash(TokenHashUtil.hashToken(rawToken));
        resetToken.setExpiresAt(Instant.now().plus(1, ChronoUnit.HOURS));
        resetTokenRepo.save(resetToken);

        mockMvc.perform(post("/api/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "token": "%s",
                                  "newPassword": "newpassword123"
                                }
                                """.formatted(rawToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Password has been reset successfully"));

        mockMvc.perform(post("/api/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "token": "%s",
                                  "newPassword": "anotherpassword123"
                                }
                                """.formatted(rawToken)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Invalid or expired reset token"));
    }

    @Test
    void resetPassword_ExpiredToken_IsRejected() throws Exception {
        User user = new User();
        user.setEmail("expired@test.com");
        user.setUsername("expired");
        user.setName("Expired");
        user.setPasswordHash(passwordEncoder.encode("password123"));
        user.setAuthProvider(User.AuthProvider.EMAIL_PASSWORD);
        user = userRepo.save(user);

        String rawToken = UUID.randomUUID().toString();
        PasswordResetToken resetToken = new PasswordResetToken();
        resetToken.setUser(user);
        resetToken.setTokenHash(TokenHashUtil.hashToken(rawToken));
        resetToken.setExpiresAt(Instant.now().minus(5, ChronoUnit.MINUTES));
        resetTokenRepo.save(resetToken);

        mockMvc.perform(post("/api/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "token": "%s",
                                  "newPassword": "newpassword123"
                                }
                                """.formatted(rawToken)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Invalid or expired reset token"));
    }
}
