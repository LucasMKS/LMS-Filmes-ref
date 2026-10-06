package com.lucasm.lmsfilmes.modules.rating.service;

import com.lucasm.lmsfilmes.core.exception.ResourceNotFoundException;
import com.lucasm.lmsfilmes.modules.auth.service.AuthService;
import com.lucasm.lmsfilmes.modules.rating.dto.EpisodeRatingRequestDTO;
import com.lucasm.lmsfilmes.modules.rating.model.RatingEpisode;
import com.lucasm.lmsfilmes.modules.rating.repository.EpisodeRatingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class RateEpisodeService {

    private final EpisodeRatingRepository episodeRatingRepository;
    private final AuthService authService;

    @Transactional
    public RatingEpisode rateEpisode(EpisodeRatingRequestDTO dto, String email) {
        Long userId = authService.getUserIdByIdentifier(email);
        if (userId == null) {
            throw new ResourceNotFoundException("Usuário não encontrado: " + email);
        }

        RatingEpisode episode = episodeRatingRepository.findByUserIdAndSerieIdAndSeasonNumberAndEpisodeNumber(
                userId, dto.getSerieId(), dto.getSeasonNumber(), dto.getEpisodeNumber()
        ).orElse(new RatingEpisode());

        episode.setUserId(userId);
        episode.setSerieId(dto.getSerieId());
        episode.setSeasonNumber(dto.getSeasonNumber());
        episode.setEpisodeNumber(dto.getEpisodeNumber());
        episode.setRating(dto.getRating());
        episode.setComment(dto.getComment());

        return episodeRatingRepository.save(episode);
    }

    public List<RatingEpisode> getRatedEpisodes(String serieId, String email) {
        Long userId = authService.getUserIdByIdentifier(email);
        if (userId == null) return List.of();

        return episodeRatingRepository.findByUserIdAndSerieIdOrderBySeasonNumberAscEpisodeNumberAsc(userId, serieId);
    }

    public List<RatingEpisode> getSeasonEpisodeRatings(String serieId, int seasonNumber, String email) {
        Long userId = authService.getUserIdByIdentifier(email);
        if (userId == null) return List.of();

        return episodeRatingRepository.findByUserIdAndSerieIdAndSeasonNumberOrderByEpisodeNumberAsc(
                userId, serieId, seasonNumber);
    }

    public RatingEpisode getEpisodeRating(String serieId, int seasonNumber, int episodeNumber, String email) {
        Long userId = authService.getUserIdByIdentifier(email);
        if (userId == null) return null;

        return episodeRatingRepository.findByUserIdAndSerieIdAndSeasonNumberAndEpisodeNumber(
                userId, serieId, seasonNumber, episodeNumber
        ).orElse(null);
    }

    @Transactional
    public void deleteEpisodeRating(String serieId, int seasonNumber, int episodeNumber, String email) {
        Long userId = authService.getUserIdByIdentifier(email);
        if (userId == null) return;

        episodeRatingRepository.deleteByUserIdAndSerieIdAndSeasonNumberAndEpisodeNumber(
                userId, serieId, seasonNumber, episodeNumber
        );
    }
}
