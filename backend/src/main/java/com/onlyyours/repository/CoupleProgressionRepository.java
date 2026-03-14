package com.onlyyours.repository;

import com.onlyyours.model.CoupleProgression;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface CoupleProgressionRepository extends JpaRepository<CoupleProgression, UUID> {
    Optional<CoupleProgression> findByCouple_Id(UUID coupleId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            SELECT cp
            FROM CoupleProgression cp
            WHERE cp.couple.id = :coupleId
            """)
    Optional<CoupleProgression> findByCoupleIdForUpdate(@Param("coupleId") UUID coupleId);
}
