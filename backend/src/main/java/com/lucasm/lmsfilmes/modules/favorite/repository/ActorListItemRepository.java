package com.lucasm.lmsfilmes.modules.favorite.repository;

import com.lucasm.lmsfilmes.modules.favorite.model.ActorListItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ActorListItemRepository extends JpaRepository<ActorListItem, Long> {
    Optional<ActorListItem> findByActorListIdAndActorId(Long actorListId, String actorId);
    void deleteByActorListIdAndActorId(Long actorListId, String actorId);
}
