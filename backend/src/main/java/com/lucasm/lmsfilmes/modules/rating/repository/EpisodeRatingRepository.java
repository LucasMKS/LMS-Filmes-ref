package com.lucasm.lmsfilmes.modules.rating.repository;

import com.lucasm.lmsfilmes.modules.rating.model.RatingEpisode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EpisodeRatingRepository extends JpaRepository<RatingEpisode, Long> {

    Optional<RatingEpisode> findByUserIdAndSerieIdAndSeasonNumberAndEpisodeNumber(
            Long userId, String serieId, int seasonNumber, int episodeNumber);

    List<RatingEpisode> findByUserIdAndSerieIdOrderBySeasonNumberAscEpisodeNumberAsc(
            Long userId, String serieId);

    List<RatingEpisode> findByUserIdAndSerieIdAndSeasonNumberOrderByEpisodeNumberAsc(
            Long userId, String serieId, int seasonNumber);

    long countByUserId(Long userId);

    void deleteByUserIdAndSerieIdAndSeasonNumberAndEpisodeNumber(
            Long userId, String serieId, int seasonNumber, int episodeNumber);
}
