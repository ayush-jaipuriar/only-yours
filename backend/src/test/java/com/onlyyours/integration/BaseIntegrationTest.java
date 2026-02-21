package com.onlyyours.integration;

import com.onlyyours.model.User;
import com.onlyyours.repository.UserRepository;
import com.onlyyours.service.JwtService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;

/**
 * Base class for all integration tests.
 *
 * Key concepts:
 * - @SpringBootTest: Loads the full Spring application context (all beans, security, JPA, etc.)
 * - @AutoConfigureMockMvc: Creates a MockMvc instance wired into the full HTTP filter chain,
 *   so security rules, JWT filters, and request mappings are all active.
 * - @Transactional: Each test runs in a transaction that is rolled back after the test,
 *   keeping the H2 in-memory database clean between tests without needing @BeforeEach cleanup.
 *
 * Unlike unit tests (which mock dependencies), integration tests use the real database
 * and real service chain. They catch bugs that unit tests cannot: misconfigured security rules,
 * JPA relationship issues, bean wiring problems, etc.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
public abstract class BaseIntegrationTest {

    @Autowired
    protected MockMvc mockMvc;

    @Autowired
    protected JwtService jwtService;

    @Autowired
    protected UserRepository userRepository;

    /**
     * Creates and persists a test User entity.
     * All fields are required (not nullable in the schema).
     */
    protected User createTestUser(String email, String name, String googleId) {
        User user = new User();
        user.setEmail(email);
        user.setName(name);
        user.setGoogleUserId(googleId);
        return userRepository.save(user);
    }

    /**
     * Generates a valid JWT for the given user.
     * Uses the real JwtService with the test secret key.
     */
    protected String createJwtFor(User user) {
        UserDetails userDetails = new org.springframework.security.core.userdetails.User(
                user.getEmail(), "", Collections.emptyList());
        return jwtService.generateToken(userDetails);
    }

    /**
     * Returns a "Bearer <token>" Authorization header value for the given user.
     * Convenience method for use with MockMvc .header("Authorization", bearerHeader(user)).
     */
    protected String bearerHeader(User user) {
        return "Bearer " + createJwtFor(user);
    }
}
