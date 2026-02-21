package com.onlyyours.service;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.jackson2.JacksonFactory;
import com.onlyyours.model.User;
import com.onlyyours.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.security.GeneralSecurityException;
import java.util.Collections;
import java.util.Optional;

/**
 * Handles Google OAuth token verification and JWT issuance.
 *
 * Authentication flow:
 * 1. Client sends Google ID token (obtained after native Google Sign-In)
 * 2. AuthService verifies the token against Google's servers using GoogleIdTokenVerifier
 * 3. On success: looks up or creates the User in our database
 * 4. Issues a signed application JWT (valid for 10 hours)
 *
 * Logging strategy:
 * - INFO: Key business events (new user registration, returning user login)
 * - WARN: Expected failure cases (invalid token, user not found)
 * - ERROR: Unexpected failures (database errors)
 * - DEBUG: Detailed diagnostics (token payload contents) — disabled in production
 */
@Service
@Slf4j
public class AuthService implements UserDetailsService {

    private final UserRepository userRepository;
    private final JwtService jwtService;

    @Value("${google.client.id}")
    private String googleClientId;

    public AuthService(UserRepository userRepository, JwtService jwtService) {
        this.userRepository = userRepository;
        this.jwtService = jwtService;
    }

    public String authenticateGoogleUser(String idTokenString) throws GeneralSecurityException, IOException {
        log.debug("Verifying Google ID token");
        GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(new NetHttpTransport(), new JacksonFactory())
                .setAudience(Collections.singletonList(googleClientId))
                .build();

        GoogleIdToken idToken = verifier.verify(idTokenString);
        if (idToken != null) {
            GoogleIdToken.Payload payload = idToken.getPayload();
            String googleUserId = payload.getSubject();
            String email = payload.getEmail();
            String name = (String) payload.get("name");

            log.debug("Google token verified for email={}", email);

            Optional<User> userOptional = userRepository.findByGoogleUserId(googleUserId);
            User user;
            if (userOptional.isPresent()) {
                user = userOptional.get();
                user.setName(name);
                user.setEmail(email);
                log.info("Returning user authenticated: userId={}", user.getId());
            } else {
                user = new User();
                user.setGoogleUserId(googleUserId);
                user.setName(name);
                user.setEmail(email);
                log.info("New user registered: email={}", email);
            }
            userRepository.save(user);

            UserDetails userDetails = new org.springframework.security.core.userdetails.User(user.getEmail(), "", Collections.emptyList());
            String jwt = jwtService.generateToken(userDetails);
            log.debug("JWT issued for userId={}", user.getId());
            return jwt;
        } else {
            log.warn("Google ID token verification failed — invalid or expired token");
            throw new IllegalArgumentException("Invalid ID token");
        }
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        log.debug("Loading user by username={}", username);
        User user = userRepository.findByEmail(username)
                .orElseThrow(() -> {
                    log.warn("User not found for username={}", username);
                    return new UsernameNotFoundException("User not found");
                });
        return new org.springframework.security.core.userdetails.User(user.getEmail(), "", Collections.emptyList());
    }
} 