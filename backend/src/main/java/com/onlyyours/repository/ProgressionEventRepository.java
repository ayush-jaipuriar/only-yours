package com.onlyyours.repository;

import com.onlyyours.model.ProgressionEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ProgressionEventRepository extends JpaRepository<ProgressionEvent, UUID> {
    boolean existsByScopeTypeAndScopeRefIdAndEventKey(
            ProgressionEvent.ScopeType scopeType,
            UUID scopeRefId,
            String eventKey
    );

    List<ProgressionEvent> findByScopeTypeAndScopeRefIdAndEventTypeOrderByCreatedAtDesc(
            ProgressionEvent.ScopeType scopeType,
            UUID scopeRefId,
            ProgressionEvent.EventType eventType
    );

    List<ProgressionEvent> findTop12ByScopeTypeAndScopeRefIdOrderByCreatedAtDesc(
            ProgressionEvent.ScopeType scopeType,
            UUID scopeRefId
    );
}
