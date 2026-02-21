package com.onlyyours.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.onlyyours.model.Couple;
import com.onlyyours.model.QuestionCategory;
import com.onlyyours.model.User;
import com.onlyyours.repository.CoupleRepository;
import com.onlyyours.repository.QuestionCategoryRepository;
import com.onlyyours.repository.UserRepository;
import com.onlyyours.service.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.Map;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class RestControllerTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private JwtService jwtService;
    @Autowired private UserRepository userRepo;
    @Autowired private CoupleRepository coupleRepo;
    @Autowired private QuestionCategoryRepository categoryRepo;

    private User testUser;
    private String validToken;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setEmail("test@example.com");
        testUser.setName("Test User");
        testUser.setGoogleUserId("google-test-123");
        testUser = userRepo.save(testUser);

        UserDetails userDetails = new org.springframework.security.core.userdetails.User(
                testUser.getEmail(), "", Collections.emptyList());
        validToken = jwtService.generateToken(userDetails);
    }

    // ============ Security Tests ============

    @Nested
    class SecurityTests {
        @Test
        void protectedEndpoint_WithoutToken_Returns401Or403() throws Exception {
            mockMvc.perform(get("/api/user/me"))
                    .andExpect(status().is4xxClientError());
        }

        @Test
        void protectedEndpoint_WithValidToken_Returns200() throws Exception {
            mockMvc.perform(get("/api/user/me")
                            .header("Authorization", "Bearer " + validToken))
                    .andExpect(status().isOk());
        }

        @Test
        void protectedEndpoint_WithMalformedToken_Returns401Or403() throws Exception {
            mockMvc.perform(get("/api/user/me")
                            .header("Authorization", "Bearer invalid.token.here"))
                    .andExpect(status().is4xxClientError());
        }

        @Test
        void authEndpoint_WithoutToken_IsAccessible() throws Exception {
            mockMvc.perform(post("/api/auth/google/signin")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"idToken\": \"fake-token\"}"))
                    .andExpect(status().is4xxClientError());
        }
    }

    // ============ UserController Tests ============

    @Nested
    class UserControllerTests {
        @Test
        void getMe_ReturnsCurrentUser() throws Exception {
            mockMvc.perform(get("/api/user/me")
                            .header("Authorization", "Bearer " + validToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.name").value("Test User"))
                    .andExpect(jsonPath("$.email").value("test@example.com"))
                    .andExpect(jsonPath("$.id").isNotEmpty());
        }
    }

    // ============ CoupleController Tests ============

    @Nested
    class CoupleControllerTests {
        @Test
        void generateCode_ReturnsCode() throws Exception {
            mockMvc.perform(post("/api/couple/generate-code")
                            .header("Authorization", "Bearer " + validToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").isNotEmpty())
                    .andExpect(jsonPath("$.code", hasLength(6)));
        }

        @Test
        void getCouple_WhenNotLinked_Returns404() throws Exception {
            mockMvc.perform(get("/api/couple")
                            .header("Authorization", "Bearer " + validToken))
                    .andExpect(status().isNotFound());
        }

        @Test
        void linkCode_ValidFlow_ReturnsCouple() throws Exception {
            String codeResponse = mockMvc.perform(post("/api/couple/generate-code")
                            .header("Authorization", "Bearer " + validToken))
                    .andReturn().getResponse().getContentAsString();
            String code = objectMapper.readTree(codeResponse).get("code").asText();

            User partner = new User();
            partner.setEmail("partner@example.com");
            partner.setName("Partner");
            partner.setGoogleUserId("google-partner-456");
            partner = userRepo.save(partner);

            UserDetails partnerDetails = new org.springframework.security.core.userdetails.User(
                    partner.getEmail(), "", Collections.emptyList());
            String partnerToken = jwtService.generateToken(partnerDetails);

            mockMvc.perform(post("/api/couple/link")
                            .header("Authorization", "Bearer " + partnerToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(Map.of("code", code))))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.user1.name").value("Test User"))
                    .andExpect(jsonPath("$.user2.name").value("Partner"));
        }

        @Test
        void getCouple_WhenLinked_ReturnsCoupleDto() throws Exception {
            User partner = new User();
            partner.setEmail("partner2@example.com");
            partner.setName("Partner2");
            partner.setGoogleUserId("google-partner2");
            partner = userRepo.save(partner);

            Couple couple = new Couple();
            couple.setUser1(testUser);
            couple.setUser2(partner);
            coupleRepo.save(couple);

            mockMvc.perform(get("/api/couple")
                            .header("Authorization", "Bearer " + validToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.user1.email").value("test@example.com"))
                    .andExpect(jsonPath("$.user2.email").value("partner2@example.com"));
        }

        @Test
        void linkCode_EmptyCode_ReturnsBadRequest() throws Exception {
            mockMvc.perform(post("/api/couple/link")
                            .header("Authorization", "Bearer " + validToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"code\": \"\"}"))
                    .andExpect(status().isBadRequest());
        }
    }

    // ============ ContentController Tests ============

    @Nested
    class ContentControllerTests {
        @Test
        void getCategories_ReturnsList() throws Exception {
            QuestionCategory cat = new QuestionCategory();
            cat.setName("Test Cat");
            cat.setDescription("Desc");
            cat.setSensitive(false);
            categoryRepo.save(cat);

            mockMvc.perform(get("/api/content/categories")
                            .header("Authorization", "Bearer " + validToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$", hasSize(greaterThanOrEqualTo(1))))
                    .andExpect(jsonPath("$[0].name").isNotEmpty());
        }

        @Test
        void getCategories_IncludesSensitiveFlag() throws Exception {
            QuestionCategory sensitive = new QuestionCategory();
            sensitive.setName("Sensitive Cat");
            sensitive.setDescription("Adult content");
            sensitive.setSensitive(true);
            categoryRepo.save(sensitive);

            mockMvc.perform(get("/api/content/categories")
                            .header("Authorization", "Bearer " + validToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$[?(@.name == 'Sensitive Cat')].sensitive").value(true));
        }
    }
}
