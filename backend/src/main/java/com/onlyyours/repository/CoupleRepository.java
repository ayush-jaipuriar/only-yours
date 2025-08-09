package com.onlyyours.repository;

import com.onlyyours.model.Couple;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CoupleRepository extends JpaRepository<Couple, UUID> {
    Optional<Couple> findByLinkCode(String linkCode);

    Optional<Couple> findByUser1_IdOrUser2_Id(UUID user1Id, UUID user2Id);
} 