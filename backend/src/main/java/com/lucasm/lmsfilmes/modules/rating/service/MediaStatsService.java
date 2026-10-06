package com.lucasm.lmsfilmes.modules.rating.service;

import com.lucasm.lmsfilmes.modules.auth.service.AuthService;
import com.lucasm.lmsfilmes.modules.rating.dto.MediaBalanceDTO;
import com.lucasm.lmsfilmes.modules.rating.repository.MovieRatingRepository;
import com.lucasm.lmsfilmes.modules.rating.repository.SerieRatingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MediaStatsService {

    private final MovieRatingRepository movieRatingRepository;
    private final SerieRatingRepository serieRatingRepository;
    private final AuthService authService;

    @Cacheable(value = "mediaBalance", key = "#email")
    public List<MediaBalanceDTO> getMediaBalance(String email) {
        Long userId = authService.getUserIdByIdentifier(email);
        if (userId == null) {
            return List.of(
                    new MediaBalanceDTO("Filmes", 0, "#eab308"),
                    new MediaBalanceDTO("Séries", 0, "#a855f7")
            );
        }

        long totalMovies = movieRatingRepository.countByUserId(userId);
        long totalSeries = serieRatingRepository.countByUserId(userId);

        return List.of(
                new MediaBalanceDTO("Filmes", (int) totalMovies, "#eab308"),
                new MediaBalanceDTO("Séries", (int) totalSeries, "#a855f7")
        );
    }
}
