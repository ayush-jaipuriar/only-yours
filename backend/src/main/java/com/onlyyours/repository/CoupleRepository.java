package com.onlyyours.repository;

import com.onlyyours.model.Couple;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface CoupleRepository extends JpaRepository<Couple, UUID> {
    Optional<Couple> findByLinkCode(String linkCode);

    Optional<Couple> findByLinkCodeAndStatus(String linkCode, Couple.RelationshipStatus status);

    Optional<Couple> findByUser1_IdOrUser2_Id(UUID user1Id, UUID user2Id);

    @Query("""
            SELECT c
            FROM Couple c
            WHERE (c.user1.id = :userId OR c.user2.id = :userId)
              AND c.status = :status
            ORDER BY c.createdAt DESC
            """)
    List<Couple> findByUserIdAndStatusOrderByCreatedAtDesc(
            @Param("userId") UUID userId,
            @Param("status") Couple.RelationshipStatus status
    );

    @Query("""
            SELECT c
            FROM Couple c
            WHERE c.user1.id = :userId
              AND c.status = :status
            ORDER BY c.createdAt DESC
            """)
    List<Couple> findByUser1IdAndStatusOrderByCreatedAtDesc(
            @Param("userId") UUID userId,
            @Param("status") Couple.RelationshipStatus status
    );
} 