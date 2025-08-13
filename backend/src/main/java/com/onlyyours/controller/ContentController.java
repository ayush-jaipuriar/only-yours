package com.onlyyours.controller;

import com.onlyyours.dto.CategoryDto;
import com.onlyyours.model.QuestionCategory;
import com.onlyyours.repository.QuestionCategoryRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/content")
public class ContentController {

    private final QuestionCategoryRepository questionCategoryRepository;

    public ContentController(QuestionCategoryRepository questionCategoryRepository) {
        this.questionCategoryRepository = questionCategoryRepository;
    }

    @GetMapping("/categories")
    public ResponseEntity<List<CategoryDto>> getCategories() {
        List<CategoryDto> categories = questionCategoryRepository.findAll().stream().map(this::toDto).collect(Collectors.toList());
        return ResponseEntity.ok(categories);
    }

    private CategoryDto toDto(QuestionCategory category) {
        CategoryDto dto = new CategoryDto();
        dto.setId(category.getId());
        dto.setName(category.getName());
        dto.setDescription(category.getDescription());
        dto.setSensitive(category.isSensitive());
        return dto;
    }
}


