package com.onlyyours.repository;

import com.onlyyours.model.GameAnswer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface GameAnswerRepository extends JpaRepository<GameAnswer, UUID> {
    
    Optional<GameAnswer> findByGameSession_IdAndQuestion_IdAndUser_Id(
        UUID gameSessionId, 
        Integer questionId, 
        UUID userId
    );
    
    long countByGameSession_IdAndQuestion_Id(UUID gameSessionId, Integer questionId);
    
    List<GameAnswer> findByGameSession_IdAndUser_IdOrderByQuestion_Id(
        UUID gameSessionId, 
        UUID userId
    );
    
    List<GameAnswer> findByGameSession_IdOrderByQuestion_Id(UUID gameSessionId);
}
