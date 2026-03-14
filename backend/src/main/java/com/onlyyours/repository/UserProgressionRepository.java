package com.onlyyours.repository;

import com.onlyyours.model.UserProgression;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserProgressionRepository extends JpaRepository<UserProgression, UUID> {
    Optional<UserProgression> findByUser_Id(UUID userId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            SELECT up
            FROM UserProgression up
            WHERE up.user.id = :userId
            """)
    Optional<UserProgression> findByUserIdForUpdate(@Param("userId") UUID userId);
}
