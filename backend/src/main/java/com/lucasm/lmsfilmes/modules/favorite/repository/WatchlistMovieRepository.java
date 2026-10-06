package com.lucasm.lmsfilmes.modules.favorite.repository;

import com.lucasm.lmsfilmes.modules.favorite.model.WatchlistMovie;
import com.lucasm.lmsfilmes.modules.favorite.model.WatchlistStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface WatchlistMovieRepository extends JpaRepository<WatchlistMovie, Long> {
    Optional<WatchlistMovie> findByUserIdAndMovieId(Long userId, String movieId);
    List<WatchlistMovie> findByUserIdOrderByAddedAtDesc(Long userId);
    List<WatchlistMovie> findByUserIdAndStatusOrderByAddedAtDesc(Long userId, WatchlistStatus status);
    List<WatchlistMovie> findByUserIdAndMovieIdIn(Long userId, Collection<String> movieIds);
    List<WatchlistMovie> findByStatusIn(Collection<WatchlistStatus> statuses);
    void deleteByUserIdAndMovieId(Long userId, String movieId);
}
