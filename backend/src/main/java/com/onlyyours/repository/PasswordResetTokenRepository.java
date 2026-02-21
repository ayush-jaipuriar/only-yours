package com.onlyyours.repository;

import com.onlyyours.model.PasswordResetToken;
import com.onlyyours.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, UUID> {

    Optional<PasswordResetToken> findByTokenHash(String tokenHash);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE PasswordResetToken prt SET prt.usedAt = :now WHERE prt.user = :user AND prt.usedAt IS NULL")
    int invalidateAllByUser(@Param("user") User user, @Param("now") Instant now);
}
