package com.lucasm.lmsfilmes.modules.favorite.repository;

import com.lucasm.lmsfilmes.modules.favorite.model.ActorList;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ActorListRepository extends JpaRepository<ActorList, Long> {
    List<ActorList> findByUserIdOrderByUpdatedAtDesc(Long userId);
    Optional<ActorList> findByIdAndUserId(Long id, Long userId);
}
