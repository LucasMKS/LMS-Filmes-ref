package com.lucasm.lmsfilmes.modules.favorite.repository;

import com.lucasm.lmsfilmes.modules.favorite.model.FavoriteActor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FavoriteActorRepository extends JpaRepository<FavoriteActor, Long> {
    List<FavoriteActor> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<FavoriteActor> findByUserId(Long userId);
    Optional<FavoriteActor> findByUserIdAndActorId(Long userId, String actorId);
    boolean existsByUserIdAndActorId(Long userId, String actorId);
    void deleteByUserIdAndActorId(Long userId, String actorId);
    void deleteByUserId(Long userId);
}
