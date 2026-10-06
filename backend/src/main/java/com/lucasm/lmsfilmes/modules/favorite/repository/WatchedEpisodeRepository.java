package com.lucasm.lmsfilmes.modules.favorite.repository;

import com.lucasm.lmsfilmes.modules.favorite.model.WatchedEpisode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WatchedEpisodeRepository extends JpaRepository<WatchedEpisode, Long> {
    Optional<WatchedEpisode> findByUserIdAndSerieIdAndSeasonNumberAndEpisodeNumber(
            String userId, String serieId, Integer seasonNumber, Integer episodeNumber);

    List<WatchedEpisode> findByUserIdAndSerieIdOrderBySeasonNumberAscEpisodeNumberAsc(
            String userId, String serieId);

    long countByUserIdAndSerieId(String userId, String serieId);

    void deleteByUserIdAndSerieIdAndSeasonNumberAndEpisodeNumber(
            String userId, String serieId, Integer seasonNumber, Integer episodeNumber);

    void deleteByUserIdAndSerieId(String userId, String serieId);
}
