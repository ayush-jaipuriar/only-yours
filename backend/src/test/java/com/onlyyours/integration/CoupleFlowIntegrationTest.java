package com.onlyyours.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.onlyyours.model.Couple;
import com.onlyyours.model.User;
import com.onlyyours.repository.CoupleRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;

import java.util.Map;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests for the complete couple linking lifecycle.
 *
 * Scenario under test:
 * 1. User A generates a link code → receives a short alphanumeric code
 * 2. User B redeems the code → couple is formed
 * 3. Both users can view the couple details via GET /api/couple
 *
 * These tests also verify important business rule enforcement:
 * - A user cannot redeem their own code (prevent self-linking)
 * - An already-used code cannot be redeemed again (prevent duplicate linking)
 * - A user with no couple gets 404, not a 500 server error
 *
 * Why integration vs unit: CoupleServiceTest (unit) mocks the repositories.
 * These tests use a real H2 database, verifying that:
 * - JPA relationships (User → Couple) are persisted correctly
 * - CoupleRepository query methods work against a real SQL engine
 * - The HTTP response shape matches what the frontend expects
 */
class CoupleFlowIntegrationTest extends BaseIntegrationTest {

    @Autowired
    private CoupleRepository coupleRepository;

    @Autowired
    private ObjectMapper objectMapper;

    private User userA;
    private User userB;

    @BeforeEach
    void setUp() {
        userA = createTestUser("usera@example.com", "User A", "google-couple-test-A");
        userB = createTestUser("userb@example.com", "User B", "google-couple-test-B");
    }

    // ============ Tests: Code Generation ============

    @Nested
    class CodeGenerationTests {

        @Test
        void generateCode_ReturnsAlphanumericCode() throws Exception {
            mockMvc.perform(post("/api/couple/generate-code")
                            .header("Authorization", bearerHeader(userA)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").isNotEmpty())
                    .andExpect(jsonPath("$.code", hasLength(6)));
        }

        @Test
        void generateCode_CodeIsUppercaseAlphanumeric() throws Exception {
            String response = mockMvc.perform(post("/api/couple/generate-code")
                            .header("Authorization", bearerHeader(userA)))
                    .andReturn().getResponse().getContentAsString();

            String code = objectMapper.readTree(response).get("code").asText();
            // Verify all characters are uppercase A-Z or 0-9
            org.junit.jupiter.api.Assertions.assertTrue(
                code.matches("[A-Z0-9]+"),
                "Code must be uppercase alphanumeric, got: " + code
            );
        }
    }

    // ============ Tests: Code Redemption ============

    @Nested
    class CodeRedemptionTests {

        @Test
        void redeemCode_ValidFlow_CreatesCoupleSuccessfully() throws Exception {
            // Step 1: User A generates a code
            String generateResponse = mockMvc.perform(post("/api/couple/generate-code")
                            .header("Authorization", bearerHeader(userA)))
                    .andExpect(status().isOk())
                    .andReturn().getResponse().getContentAsString();

            String code = objectMapper.readTree(generateResponse).get("code").asText();

            // Step 2: User B redeems the code
            mockMvc.perform(post("/api/couple/link")
                            .header("Authorization", bearerHeader(userB))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(Map.of("code", code))))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.user1.email").value("usera@example.com"))
                    .andExpect(jsonPath("$.user2.email").value("userb@example.com"));
        }

        @Test
        void redeemOwnCode_Returns400() throws Exception {
            // User A generates a code, then tries to redeem it themselves
            // This is a business rule: you can't link with yourself
            String generateResponse = mockMvc.perform(post("/api/couple/generate-code")
                            .header("Authorization", bearerHeader(userA)))
                    .andExpect(status().isOk())
                    .andReturn().getResponse().getContentAsString();

            String code = objectMapper.readTree(generateResponse).get("code").asText();

            // User A tries to redeem their own code → should be rejected
            mockMvc.perform(post("/api/couple/link")
                            .header("Authorization", bearerHeader(userA))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(Map.of("code", code))))
                    .andExpect(status().isBadRequest());
        }

        @Test
        void redeemAlreadyUsedCode_Returns4xx() throws Exception {
            // Step 1: User A generates a code
            String generateResponse = mockMvc.perform(post("/api/couple/generate-code")
                            .header("Authorization", bearerHeader(userA)))
                    .andExpect(status().isOk())
                    .andReturn().getResponse().getContentAsString();

            String code = objectMapper.readTree(generateResponse).get("code").asText();

            // Step 2: User B redeems it successfully
            mockMvc.perform(post("/api/couple/link")
                            .header("Authorization", bearerHeader(userB))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(Map.of("code", code))))
                    .andExpect(status().isOk());

            // Step 3: Create a third user who tries to redeem the same (now-invalid) code
            User userC = createTestUser("userc@example.com", "User C", "google-couple-test-C");
            mockMvc.perform(post("/api/couple/link")
                            .header("Authorization", bearerHeader(userC))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(Map.of("code", code))))
                    .andExpect(status().is4xxClientError());
        }

        @Test
        void redeemNonExistentCode_Returns4xx() throws Exception {
            mockMvc.perform(post("/api/couple/link")
                            .header("Authorization", bearerHeader(userB))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(Map.of("code", "XXXXXX"))))
                    .andExpect(status().is4xxClientError());
        }

        @Test
        void redeemEmptyCode_Returns400() throws Exception {
            mockMvc.perform(post("/api/couple/link")
                            .header("Authorization", bearerHeader(userB))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(Map.of("code", ""))))
                    .andExpect(status().isBadRequest());
        }
    }

    // ============ Tests: Get Couple ============

    @Nested
    class GetCoupleTests {

        @Test
        void getCouple_BeforeLinking_Returns404() throws Exception {
            mockMvc.perform(get("/api/couple")
                            .header("Authorization", bearerHeader(userA)))
                    .andExpect(status().isNotFound());
        }

        @Test
        void getCouple_AfterLinking_Returns200WithBothUsers() throws Exception {
            // Create a couple directly in the database (bypassing the code flow)
            Couple couple = new Couple();
            couple.setUser1(userA);
            couple.setUser2(userB);
            coupleRepository.save(couple);

            mockMvc.perform(get("/api/couple")
                            .header("Authorization", bearerHeader(userA)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.user1.email").value("usera@example.com"))
                    .andExpect(jsonPath("$.user2.email").value("userb@example.com"));
        }

        @Test
        void getCouple_PartnerCanAlsoRetrieveIt() throws Exception {
            // Both user1 and user2 should be able to fetch the couple record
            Couple couple = new Couple();
            couple.setUser1(userA);
            couple.setUser2(userB);
            coupleRepository.save(couple);

            // UserB (user2) fetches the couple
            mockMvc.perform(get("/api/couple")
                            .header("Authorization", bearerHeader(userB)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.user1.email").value("usera@example.com"))
                    .andExpect(jsonPath("$.user2.email").value("userb@example.com"));
        }
    }
}
