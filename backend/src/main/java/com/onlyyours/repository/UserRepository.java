package com.onlyyours.repository;

import com.onlyyours.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByGoogleUserId(String googleUserId);
    Optional<User> findByEmail(String email);
} 