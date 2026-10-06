package com.lucasm.lmsfilmes.modules.rating.service;

import com.lucasm.lmsfilmes.modules.auth.service.AuthService;
import com.lucasm.lmsfilmes.modules.rating.dto.DashboardStatsDTO;
import com.lucasm.lmsfilmes.modules.rating.model.RatingMovie;
import com.lucasm.lmsfilmes.modules.rating.model.RatingSerie;
import com.lucasm.lmsfilmes.modules.rating.repository.MovieRatingRepository;
import com.lucasm.lmsfilmes.modules.rating.repository.SerieRatingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final MovieRatingRepository movieRatingRepository;
    private final SerieRatingRepository serieRatingRepository;
    private final AuthService authService;

    private static final int AVG_MOVIE_RUNTIME_MINUTES = 120;
    private static final int AVG_EPISODE_RUNTIME_MINUTES = 45;

    @Cacheable(value = "dashboardStats", key = "#email")
    public DashboardStatsDTO getUserStats(String email) {
        Long userId = authService.getUserIdByIdentifier(email);
        if (userId == null) {
            return new DashboardStatsDTO(0, 0, 0, 0, 0, 0, 0.0, 0.0);
        }

        List<RatingMovie> movies = movieRatingRepository.findAllByUserIdOrderByCreatedAtDesc(userId);
        List<RatingSerie> series = serieRatingRepository.findAllByUserIdOrderByCreatedAtDesc(userId);

        long totalMovies = 0;
        long totalSeries = series.size();
        long totalEpisodesWatched = 0;
        long estimatedMinutes = 0;

        double sumMovieRating = 0;
        for (RatingMovie m : movies) {
            long count = 1 + (m.getRewatchCount() != null ? m.getRewatchCount() : 0);
            totalMovies += count;
            estimatedMinutes += count * AVG_MOVIE_RUNTIME_MINUTES;
            if (m.getRating() != null) sumMovieRating += m.getRating();
        }

        double sumSerieRating = 0;
        for (RatingSerie s : series) {
            long eps = s.getWatchedEpisodes() != null ? s.getWatchedEpisodes() : 0;
            long totalEps = s.getTotalEpisodes() != null ? s.getTotalEpisodes() : 0;

            if (eps == 0) eps = 10;
            if (totalEps == 0) totalEps = 10;

            long rewatchCount = s.getRewatchCount() != null ? s.getRewatchCount() : 0;
            long epsFromRewatches = rewatchCount * totalEps;

            long currentEps = eps + epsFromRewatches;
            totalEpisodesWatched += currentEps;
            estimatedMinutes += currentEps * AVG_EPISODE_RUNTIME_MINUTES;

            if (s.getRating() != null) sumSerieRating += s.getRating();
        }

        long estimatedHours = estimatedMinutes / 60;
        long estimatedDays = estimatedHours / 24;

        Double avgMovie = movies.isEmpty() ? 0.0 : Math.round((sumMovieRating / movies.size()) * 10.0) / 10.0;
        Double avgSerie = series.isEmpty() ? 0.0 : Math.round((sumSerieRating / series.size()) * 10.0) / 10.0;

        return DashboardStatsDTO.builder()
                .totalMovies(totalMovies)
                .totalSeries(totalSeries)
                .totalEpisodesWatched(totalEpisodesWatched)
                .estimatedMinutesSpent(estimatedMinutes)
                .estimatedHoursSpent(estimatedHours)
                .estimatedDaysSpent(estimatedDays)
                .averageMovieRating(avgMovie)
                .averageSerieRating(avgSerie)
                .build();
    }
}
