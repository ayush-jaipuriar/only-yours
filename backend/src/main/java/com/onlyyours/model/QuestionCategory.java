package com.onlyyours.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "question_categories")
@Data
public class QuestionCategory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false)
    private String name;

    private String description;

    @Column(nullable = false)
    private boolean isSensitive = false;
} 