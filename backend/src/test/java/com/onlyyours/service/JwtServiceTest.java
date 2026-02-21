package com.onlyyours.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collections;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class JwtServiceTest {

    @Autowired
    private JwtService jwtService;

    private UserDetails testUser;

    @BeforeEach
    void setUp() {
        testUser = new User("testuser@example.com", "", Collections.emptyList());
    }

    @Test
    void testGenerateToken_ReturnsNonNullToken() {
        String token = jwtService.generateToken(testUser);

        assertNotNull(token);
        assertFalse(token.isEmpty());
    }

    @Test
    void testGenerateToken_ContainsThreeParts() {
        String token = jwtService.generateToken(testUser);

        String[] parts = token.split("\\.");
        assertEquals(3, parts.length, "JWT should have header.payload.signature");
    }

    @Test
    void testExtractUsername_ReturnsCorrectSubject() {
        String token = jwtService.generateToken(testUser);

        String username = jwtService.extractUsername(token);

        assertEquals("testuser@example.com", username);
    }

    @Test
    void testExtractExpiration_ReturnsFutureDate() {
        String token = jwtService.generateToken(testUser);

        java.util.Date expiration = jwtService.extractExpiration(token);

        assertNotNull(expiration);
        assertTrue(expiration.after(new java.util.Date()), "Expiration should be in the future");
    }

    @Test
    void testValidateToken_ValidTokenReturnsTrue() {
        String token = jwtService.generateToken(testUser);

        assertTrue(jwtService.validateToken(token, testUser));
    }

    @Test
    void testValidateToken_WrongUserReturnsFalse() {
        String token = jwtService.generateToken(testUser);
        UserDetails wrongUser = new User("wrong@example.com", "", Collections.emptyList());

        assertFalse(jwtService.validateToken(token, wrongUser));
    }

    @Test
    void testValidateToken_MalformedTokenThrowsException() {
        assertThrows(Exception.class, () ->
            jwtService.extractUsername("not.a.valid.jwt.token"));
    }

    @Test
    void testGenerateToken_DifferentUsersGetDifferentTokens() {
        UserDetails user2 = new User("other@example.com", "", Collections.emptyList());

        String token1 = jwtService.generateToken(testUser);
        String token2 = jwtService.generateToken(user2);

        assertNotEquals(token1, token2);
    }

    @Test
    void testExtractUsername_FromDifferentTokens() {
        UserDetails user2 = new User("partner@example.com", "", Collections.emptyList());

        String token1 = jwtService.generateToken(testUser);
        String token2 = jwtService.generateToken(user2);

        assertEquals("testuser@example.com", jwtService.extractUsername(token1));
        assertEquals("partner@example.com", jwtService.extractUsername(token2));
    }
}
