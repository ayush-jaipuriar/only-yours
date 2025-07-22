package com.onlyyours.repository;

import com.onlyyours.model.GameAnswer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface GameAnswerRepository extends JpaRepository<GameAnswer, UUID> {
} 