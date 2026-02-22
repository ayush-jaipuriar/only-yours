package com.onlyyours.repository;

import com.onlyyours.model.PushToken;
import com.onlyyours.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PushTokenRepository extends JpaRepository<PushToken, UUID> {

    List<PushToken> findByUser(User user);

    Optional<PushToken> findByToken(String token);

    void deleteByToken(String token);

    void deleteByUser(User user);
}
