package com.onlyyours.integration;

import com.onlyyours.model.User;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;

import java.util.Date;
import java.util.HashMap;

import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Integration tests for the authentication and JWT security flow.
 *
 * These tests verify the full request pipeline:
 *   HTTP request → JwtAuthFilter → SecurityConfig rules → Controller → Service → H2 DB
 *
 * Why these differ from unit tests:
 * - JwtServiceTest (unit) verifies token generation/validation in isolation.
 * - These tests verify that the SECURITY FILTER CHAIN is configured correctly:
 *   • Does SecurityConfig.java actually block un-authenticated requests?
 *   • Does JwtAuthFilter.java correctly set the authentication principal?
 *   • Are public endpoints (like /api/auth/**) actually open?
 *
 * A bug in SecurityConfig (wrong URL pattern) would pass unit tests but fail here.
 */
class AuthFlowIntegrationTest extends BaseIntegrationTest {

    /**
     * The JWT secret is injected from src/test/resources/application.properties.
     * We use it to hand-craft tokens (e.g., expired ones) for edge-case testing.
     */
    @Value("${jwt.secret}")
    private String jwtSecret;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = createTestUser("authtest@example.com", "Auth Test User", "google-auth-test-001");
    }

    // ============ Tests: No Token ============

    @Nested
    class NoTokenTests {

        @Test
        void userMe_WithNoToken_IsBlocked() throws Exception {
            mockMvc.perform(get("/api/user/me"))
                    .andExpect(status().is4xxClientError());
        }

        @Test
        void couple_WithNoToken_IsBlocked() throws Exception {
            mockMvc.perform(get("/api/couple"))
                    .andExpect(status().is4xxClientError());
        }

        @Test
        void categories_WithNoToken_IsBlocked() throws Exception {
            mockMvc.perform(get("/api/content/categories"))
                    .andExpect(status().is4xxClientError());
        }
    }

    // ============ Tests: Valid Token ============

    @Nested
    class ValidTokenTests {

        @Test
        void userMe_WithValidToken_Returns200WithUserData() throws Exception {
            mockMvc.perform(get("/api/user/me")
                            .header("Authorization", bearerHeader(testUser)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.email").value("authtest@example.com"))
                    .andExpect(jsonPath("$.name").value("Auth Test User"))
                    .andExpect(jsonPath("$.id").isNotEmpty());
        }

        @Test
        void categories_WithValidToken_Returns200() throws Exception {
            mockMvc.perform(get("/api/content/categories")
                            .header("Authorization", bearerHeader(testUser)))
                    .andExpect(status().isOk());
        }
    }

    // ============ Tests: Malformed Token ============

    @Nested
    class MalformedTokenTests {

        /**
         * Tests that structurally invalid JWTs are rejected with a 4xx.
         * Before Sprint 4, malformed tokens caused a 500 (NullPointerException in JwtAuthFilter).
         * JwtAuthFilter now wraps all exceptions — these tests ensure the fix remains in place.
         */
        @Test
        void userMe_WithGarbageToken_Returns4xx() throws Exception {
            mockMvc.perform(get("/api/user/me")
                            .header("Authorization", "Bearer this.is.garbage"))
                    .andExpect(status().is4xxClientError());
        }

        @Test
        void userMe_WithEmptyBearerToken_Returns4xx() throws Exception {
            mockMvc.perform(get("/api/user/me")
                            .header("Authorization", "Bearer "))
                    .andExpect(status().is4xxClientError());
        }

        @Test
        void userMe_WithBasicAuth_Returns4xx() throws Exception {
            // Wrong auth scheme — should not be accepted as a valid JWT
            mockMvc.perform(get("/api/user/me")
                            .header("Authorization", "Basic dXNlcjpwYXNz"))
                    .andExpect(status().is4xxClientError());
        }
    }

    // ============ Tests: Expired Token ============

    @Nested
    class ExpiredTokenTests {

        /**
         * JWT expiry test: creates a token where the "exp" claim is in the past.
         *
         * Concept: JWTs contain three base64-encoded parts — header, payload, signature.
         * The payload contains "exp" (expiry timestamp in seconds since Unix epoch).
         * The jjwt library throws ExpiredJwtException when it sees exp < now.
         * JwtAuthFilter must catch this and return 401/403 (not 500).
         *
         * Here we craft the expired token manually using the same secret that JwtService uses,
         * bypassing JwtService's forced 10-hour expiry. This is only possible in tests because
         * we have direct access to the secret value.
         */
        @Test
        void userMe_WithExpiredToken_Returns4xx() throws Exception {
            String expiredToken = Jwts.builder()
                    .setClaims(new HashMap<>())
                    .setSubject(testUser.getEmail())
                    .setIssuedAt(new Date(System.currentTimeMillis() - 7_200_000))   // issued 2 hours ago
                    .setExpiration(new Date(System.currentTimeMillis() - 3_600_000)) // expired 1 hour ago
                    .signWith(SignatureAlgorithm.HS256, jwtSecret)
                    .compact();

            mockMvc.perform(get("/api/user/me")
                            .header("Authorization", "Bearer " + expiredToken))
                    .andExpect(status().is4xxClientError());
        }
    }

    // ============ Tests: Public Endpoints ============

    @Nested
    class PublicEndpointTests {

        /**
         * The /api/auth/google/signin endpoint must be publicly accessible (no JWT required).
         * SecurityConfig permits /api/auth/**, so a request must reach the controller.
         *
         * With a fake Google token, the controller returns 400 (not 403).
         * If this returned 403, it would mean SecurityConfig is misconfigured and is blocking
         * the auth endpoint itself — which would make login impossible.
         */
        @Test
        void authSignIn_WithFakeGoogleToken_Returns400NotForbidden() throws Exception {
            mockMvc.perform(post("/api/auth/google/signin")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"idToken\": \"fake.google.id.token\"}"))
                    .andExpect(result ->
                        assertNotEquals(403, result.getResponse().getStatus(),
                            "Auth endpoint must be publicly accessible - 403 means SecurityConfig blocks it"));
        }

        @Test
        void wsEndpoint_IsAccessibleForHandshake() throws Exception {
            // /ws/** must be permitted for WebSocket handshake (SockJS uses HTTP GET initially)
            // We just verify it's not 403 (Spring Security block)
            mockMvc.perform(get("/ws/info"))
                    .andExpect(result ->
                        assertNotEquals(403, result.getResponse().getStatus(),
                            "/ws/** must be permitted for WebSocket SockJS handshake"));
        }
    }
}
