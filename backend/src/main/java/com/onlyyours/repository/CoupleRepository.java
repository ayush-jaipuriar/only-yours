package com.onlyyours.repository;

import com.onlyyours.model.Couple;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface CoupleRepository extends JpaRepository<Couple, UUID> {
} 