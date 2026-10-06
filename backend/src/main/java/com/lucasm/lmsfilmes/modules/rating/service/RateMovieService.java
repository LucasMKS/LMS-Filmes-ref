package com.lucasm.lmsfilmes.modules.rating.service;

import com.lucasm.lmsfilmes.core.exception.MovieServiceException;
import com.lucasm.lmsfilmes.core.exception.ResourceNotFoundException;
import com.lucasm.lmsfilmes.modules.auth.service.AuthService;
import com.lucasm.lmsfilmes.modules.catalog.model.Movie;
import com.lucasm.lmsfilmes.modules.catalog.repository.MovieRepository;
import com.lucasm.lmsfilmes.modules.rating.dto.RatingMovieResponseDTO;
import com.lucasm.lmsfilmes.modules.rating.dto.RatingRequestDTO;
import com.lucasm.lmsfilmes.modules.rating.dto.RatingStatusDTO;
import com.lucasm.lmsfilmes.modules.rating.model.RatingMovie;
import com.lucasm.lmsfilmes.modules.rating.repository.MovieRatingRepository;
import com.lucasm.lmsfilmes.shared.event.CatalogSyncEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class RateMovieService {

    private final MovieRatingRepository movieRatingRepository;
    private final MovieRepository catalogMovieRepository;
    private final AuthService authService;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional
    @CacheEvict(value = {"userRatedMovies", "dashboardStats", "mediaBalance"}, allEntries = true)
    public RatingMovieResponseDTO rateMovie(RatingRequestDTO request, String email) {
        Long userId = authService.getUserIdByIdentifier(email);
        if (userId == null) {
            throw new MovieServiceException("Usuário não encontrado: " + email);
        }

        // Sincroniza em catálogo em memória se necessário
        eventPublisher.publishEvent(new CatalogSyncEvent(
                request.getMovieId(),
                request.getTitle(),
                request.getPoster_path(),
                false
        ));

        RatingMovie movie = movieRatingRepository.findByMovieIdAndUserId(request.getMovieId(), userId)
                .orElse(new RatingMovie());

        movie.setMovieId(request.getMovieId());
        movie.setUserId(userId);
        movie.setRating(request.getRating());
        movie.setComment(request.getComment());
        if (request.getRewatchCount() != null) {
            movie.setRewatchCount(request.getRewatchCount());
        }

        RatingMovie saved = movieRatingRepository.save(movie);

        return toDto(saved, request.getTitle(), request.getPoster_path());
    }

    public List<RatingMovieResponseDTO> getRatedMovies(String email) {
        Long userId = authService.getUserIdByIdentifier(email);
        if (userId == null) return List.of();

        List<RatingMovie> ratings = movieRatingRepository.findAllByUserIdOrderByCreatedAtDesc(userId);
        return enrichWithCatalog(ratings);
    }

    public Page<RatingMovieResponseDTO> getRatedMoviesPaged(String email, Pageable pageable, Double minRating, Double maxRating, String title) {
        Long userId = authService.getUserIdByIdentifier(email);
        if (userId == null) return Page.empty();

        Page<RatingMovie> page;
        boolean hasRating = minRating != null && maxRating != null;
        boolean hasTitle = title != null && !title.isBlank();

        if (hasTitle && hasRating) {
            page = movieRatingRepository.findByUserIdAndTitleAndRatingRange(userId, title.trim(), minRating, maxRating, pageable);
        } else if (hasTitle) {
            page = movieRatingRepository.findByUserIdAndTitleContainingIgnoreCase(userId, title.trim(), pageable);
        } else if (hasRating) {
            page = movieRatingRepository.findByUserIdAndRatingRange(userId, minRating, maxRating, pageable);
        } else {
            page = movieRatingRepository.findAllByUserIdOrderByCreatedAtDesc(userId, pageable);
        }

        List<RatingMovieResponseDTO> enriched = enrichWithCatalog(page.getContent());
        return page.map(r -> enriched.stream()
                .filter(dto -> dto.getId().equals(r.getId()))
                .findFirst()
                .orElseGet(() -> toDto(r, null, null)));
    }

    public RatingMovieResponseDTO getMovieRating(String movieId, String email) {
        Long userId = authService.getUserIdByIdentifier(email);
        if (userId == null) return null;

        Optional<RatingMovie> opt = movieRatingRepository.findByMovieIdAndUserId(movieId, userId);
        if (opt.isEmpty()) return null;

        RatingMovie rating = opt.get();
        Movie cat = catalogMovieRepository.findById(movieId).orElse(null);
        return toDto(rating, cat != null ? cat.getTitle() : null, cat != null ? cat.getPosterPath() : null);
    }

    @Transactional
    @CacheEvict(value = {"userRatedMovies", "dashboardStats", "mediaBalance"}, allEntries = true)
    public void deleteMovieRating(String movieId, String email) {
        Long userId = authService.getUserIdByIdentifier(email);
        if (userId != null) {
            movieRatingRepository.findByMovieIdAndUserId(movieId, userId)
                    .ifPresent(movieRatingRepository::delete);
        }
    }

    public Map<String, RatingStatusDTO> getRatingStatuses(String email, List<String> movieIds) {
        if (movieIds == null || movieIds.isEmpty()) return Map.of();
        Long userId = authService.getUserIdByIdentifier(email);
        if (userId == null) return Map.of();

        List<RatingMovie> ratings = movieRatingRepository.findByUserIdAndMovieIdIn(userId, movieIds);
        Map<String, RatingStatusDTO> result = new HashMap<>();
        for (RatingMovie r : ratings) {
            result.put(r.getMovieId(), new RatingStatusDTO(String.valueOf(r.getRating()), r.getComment()));
        }
        return result;
    }

    private List<RatingMovieResponseDTO> enrichWithCatalog(List<RatingMovie> ratings) {
        if (ratings == null || ratings.isEmpty()) return List.of();
        List<String> movieIds = ratings.stream()
                .map(RatingMovie::getMovieId)
                .filter(Objects::nonNull)
                .distinct()
                .toList();

        Map<String, Movie> catalogMap = new HashMap<>();
        if (!movieIds.isEmpty()) {
            try {
                for (Movie m : catalogMovieRepository.findByMovieIdIn(movieIds)) {
                    if (m != null && m.getMovieId() != null) {
                        catalogMap.put(m.getMovieId(), m);
                    }
                }
            } catch (Exception e) {
                log.warn("Erro ao buscar catalogo de filmes para avaliacoes: {}", e.getMessage());
            }
        }

        return ratings.stream().map(r -> {
            Movie cat = catalogMap.get(r.getMovieId());
            return toDto(r, cat != null ? cat.getTitle() : null, cat != null ? cat.getPosterPath() : null);
        }).toList();
    }

    private RatingMovieResponseDTO toDto(RatingMovie r, String title, String posterPath) {
        return RatingMovieResponseDTO.builder()
                .id(r.getId())
                .movieId(r.getMovieId())
                .title(title)
                .posterPath(posterPath)
                .rating(r.getRating())
                .comment(r.getComment())
                .rewatchCount(r.getRewatchCount() != null ? r.getRewatchCount() : 0)
                .createdAt(r.getCreatedAt())
                .modifiedAt(r.getModifiedAt())
                .build();
    }
}
