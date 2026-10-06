package com.lucasm.lmsfilmes.modules.favorite.repository;

import com.lucasm.lmsfilmes.modules.favorite.model.WatchlistSerie;
import com.lucasm.lmsfilmes.modules.favorite.model.WatchlistStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface WatchlistSerieRepository extends JpaRepository<WatchlistSerie, Long> {
    Optional<WatchlistSerie> findByUserIdAndSerieId(Long userId, String serieId);
    List<WatchlistSerie> findByUserIdOrderByAddedAtDesc(Long userId);
    List<WatchlistSerie> findByUserIdAndStatusOrderByAddedAtDesc(Long userId, WatchlistStatus status);
    List<WatchlistSerie> findByUserIdAndSerieIdIn(Long userId, Collection<String> serieIds);
    List<WatchlistSerie> findByStatusIn(Collection<WatchlistStatus> statuses);
    void deleteByUserIdAndSerieId(Long userId, String serieId);
}
