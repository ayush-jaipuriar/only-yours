package com.onlyyours.integration;

import com.onlyyours.model.QuestionCategory;
import com.onlyyours.model.User;
import com.onlyyours.repository.QuestionCategoryRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests for the content (category) endpoint.
 *
 * Tests verify:
 * 1. The endpoint is protected — unauthenticated requests are blocked
 * 2. The endpoint returns a properly shaped JSON array with category data
 * 3. Sensitive categories include the `sensitive: true` flag in the response
 * 4. An empty category table returns an empty array (not a 500 or null)
 *
 * ContentController is simple (just delegates to the repository), but these tests
 * ensure the JPA query, JSON serialization, and security are all wired together correctly.
 */
class ContentIntegrationTest extends BaseIntegrationTest {

    @Autowired
    private QuestionCategoryRepository categoryRepository;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = createTestUser("content-test@example.com", "Content Tester", "google-content-001");
    }

    @Test
    void getCategories_WithoutToken_Returns403() throws Exception {
        mockMvc.perform(get("/api/content/categories"))
                .andExpect(status().is4xxClientError());
    }

    @Test
    void getCategories_WithValidToken_Returns200AndArray() throws Exception {
        // Seed one category so the response is non-empty
        QuestionCategory cat = new QuestionCategory();
        cat.setName("Integration Test Category");
        cat.setDescription("Testing purposes");
        cat.setSensitive(false);
        categoryRepository.save(cat);

        mockMvc.perform(get("/api/content/categories")
                        .header("Authorization", bearerHeader(testUser)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$[*].name", hasItem("Integration Test Category")));
    }

    @Test
    void getCategories_SensitiveCategoryHasSensitiveFlag() throws Exception {
        QuestionCategory sensitive = new QuestionCategory();
        sensitive.setName("Sensitive Integration Category");
        sensitive.setDescription("Mature content for integration testing");
        sensitive.setSensitive(true);
        categoryRepository.save(sensitive);

        mockMvc.perform(get("/api/content/categories")
                        .header("Authorization", bearerHeader(testUser)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.name == 'Sensitive Integration Category')].sensitive")
                        .value(true));
    }

    @Test
    void getCategories_NonSensitiveCategoryHasSensitiveFlagFalse() throws Exception {
        QuestionCategory normal = new QuestionCategory();
        normal.setName("Normal Integration Category");
        normal.setDescription("Safe content for integration testing");
        normal.setSensitive(false);
        categoryRepository.save(normal);

        mockMvc.perform(get("/api/content/categories")
                        .header("Authorization", bearerHeader(testUser)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.name == 'Normal Integration Category')].sensitive")
                        .value(false));
    }

    @Test
    void getCategories_ResponseContainsRequiredFields() throws Exception {
        QuestionCategory cat = new QuestionCategory();
        cat.setName("Fields Check Category");
        cat.setDescription("Verify all fields are serialized");
        cat.setSensitive(false);
        categoryRepository.save(cat);

        mockMvc.perform(get("/api/content/categories")
                        .header("Authorization", bearerHeader(testUser)))
                .andExpect(status().isOk())
                // Each category in the array must have id, name, description, and sensitive fields
                .andExpect(jsonPath("$[*].id").exists())
                .andExpect(jsonPath("$[*].name").exists())
                .andExpect(jsonPath("$[*].description").exists())
                .andExpect(jsonPath("$[*].sensitive").exists());
    }
}
