package com.lucasm.lmsfilmes.modules.rating.service;

import com.lucasm.lmsfilmes.core.exception.MovieServiceException;
import com.lucasm.lmsfilmes.core.exception.ResourceNotFoundException;
import com.lucasm.lmsfilmes.modules.auth.service.AuthService;
import com.lucasm.lmsfilmes.modules.catalog.model.Serie;
import com.lucasm.lmsfilmes.modules.catalog.repository.SerieRepository;
import com.lucasm.lmsfilmes.modules.rating.dto.RatingSerieResponseDTO;
import com.lucasm.lmsfilmes.modules.rating.dto.RatingStatusDTO;
import com.lucasm.lmsfilmes.modules.rating.dto.SerieRatingRequestDTO;
import com.lucasm.lmsfilmes.modules.rating.model.RatingSerie;
import com.lucasm.lmsfilmes.modules.rating.repository.SerieRatingRepository;
import com.lucasm.lmsfilmes.shared.event.CatalogSyncEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
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
public class RateSerieService {

    private final SerieRatingRepository serieRatingRepository;
    private final SerieRepository catalogSerieRepository;
    private final AuthService authService;
    private final ApplicationEventPublisher eventPublisher;
    private final com.lucasm.lmsfilmes.modules.favorite.repository.WatchlistSerieRepository watchlistSerieRepository;

    @Transactional
    @CacheEvict(value = {"userRatedSeries", "dashboardStats", "mediaBalance"}, allEntries = true)
    public RatingSerieResponseDTO rateSerie(SerieRatingRequestDTO request, String email) {
        Long userId = authService.getUserIdByIdentifier(email);
        if (userId == null) {
            throw new MovieServiceException("Usuário não encontrado: " + email);
        }

        // Sincroniza série no catálogo em memória se necessário
        eventPublisher.publishEvent(new CatalogSyncEvent(
                request.getSerieId(),
                request.getTitle(),
                request.getPoster_path(),
                true
        ));

        RatingSerie serie = serieRatingRepository.findBySerieIdAndUserId(request.getSerieId(), userId)
                .orElse(new RatingSerie());

        serie.setSerieId(request.getSerieId());
        serie.setUserId(userId);
        serie.setRating(request.getRating());
        serie.setComment(request.getComment());
        if (request.getRewatchCount() != null) {
            serie.setRewatchCount(request.getRewatchCount());
        }

        RatingSerie saved = serieRatingRepository.save(serie);

        // Remove automaticamente da watchlist ao avaliar ou re-avaliar
        try {
            watchlistSerieRepository.findByUserIdAndSerieId(userId, request.getSerieId())
                    .ifPresent(watchlistSerieRepository::delete);
        } catch (Exception e) {
            log.warn("Não foi possível remover série {} da watchlist: {}", request.getSerieId(), e.getMessage());
        }

        Serie cat = catalogSerieRepository.findById(request.getSerieId()).orElse(null);
        String finalTitle = request.getTitle() != null && !request.getTitle().isBlank()
                ? request.getTitle()
                : (cat != null ? cat.getTitle() : null);
        String finalPoster = request.getPoster_path() != null && !request.getPoster_path().isBlank()
                ? request.getPoster_path()
                : (cat != null ? cat.getPosterPath() : null);

        return toDto(saved, finalTitle, finalPoster);
    }

    public List<RatingSerieResponseDTO> getRatedSeries(String email) {
        Long userId = authService.getUserIdByIdentifier(email);
        if (userId == null) return List.of();

        List<RatingSerie> ratings;
        try {
            ratings = serieRatingRepository.findAllByUserIdOrderByCreatedAtDesc(userId);
        } catch (Exception e) {
            log.warn("Erro ao buscar avaliações de séries por createdAt: {}. Tentando por ID.", e.getMessage());
            try {
                ratings = serieRatingRepository.findAllByUserIdOrderByIdDesc(userId);
            } catch (Exception ex) {
                log.warn("Erro ao buscar avaliações de séries por ID: {}. Tentando busca simples.", ex.getMessage());
                ratings = serieRatingRepository.findAllByUserId(userId);
            }
        }
        return enrichWithCatalog(ratings);
    }

    public Page<RatingSerieResponseDTO> getRatedSeriesPaged(String email, Pageable pageable, Double minRating, Double maxRating, String title) {
        Long userId = authService.getUserIdByIdentifier(email);
        if (userId == null) return Page.empty();

        Page<RatingSerie> page;
        boolean hasRating = minRating != null && maxRating != null;
        boolean hasTitle = title != null && !title.isBlank();

        if (hasTitle && hasRating) {
            page = serieRatingRepository.findByUserIdAndTitleAndRatingRange(userId, title.trim(), minRating, maxRating, pageable);
        } else if (hasTitle) {
            page = serieRatingRepository.findByUserIdAndTitleContainingIgnoreCase(userId, title.trim(), pageable);
        } else if (hasRating) {
            page = serieRatingRepository.findByUserIdAndRatingRange(userId, minRating, maxRating, pageable);
        } else {
            page = serieRatingRepository.findAllByUserIdOrderByCreatedAtDesc(userId, pageable);
        }

        List<RatingSerieResponseDTO> enriched = enrichWithCatalog(page.getContent());
        return page.map(r -> enriched.stream()
                .filter(dto -> dto.getId().equals(r.getId()))
                .findFirst()
                .orElseGet(() -> toDto(r, null, null)));
    }

    public RatingSerieResponseDTO getSerieRating(String serieId, String email) {
        Long userId = authService.getUserIdByIdentifier(email);
        if (userId == null) return null;

        Optional<RatingSerie> opt = serieRatingRepository.findBySerieIdAndUserId(serieId, userId);
        if (opt.isEmpty()) return null;

        RatingSerie rating = opt.get();
        Serie cat = catalogSerieRepository.findById(serieId).orElse(null);
        return toDto(rating, cat != null ? cat.getTitle() : null, cat != null ? cat.getPosterPath() : null);
    }

    @Transactional
    @CacheEvict(value = {"userRatedSeries", "dashboardStats", "mediaBalance"}, allEntries = true)
    public void deleteSerieRating(String serieId, String email) {
        Long userId = authService.getUserIdByIdentifier(email);
        if (userId != null) {
            serieRatingRepository.findBySerieIdAndUserId(serieId, userId)
                    .ifPresent(serieRatingRepository::delete);
        }
    }

    public Map<String, RatingStatusDTO> getRatingStatuses(String email, List<String> serieIds) {
        if (serieIds == null || serieIds.isEmpty()) return Map.of();
        Long userId = authService.getUserIdByIdentifier(email);
        if (userId == null) return Map.of();

        List<RatingSerie> ratings = serieRatingRepository.findByUserIdAndSerieIdIn(userId, serieIds);
        Map<String, RatingStatusDTO> result = new HashMap<>();
        for (RatingSerie r : ratings) {
            result.put(r.getSerieId(), new RatingStatusDTO(String.valueOf(r.getRating()), r.getComment()));
        }
        return result;
    }

    @Transactional
    public void incrementRewatch(String serieId, String email) {
        Long userId = authService.getUserIdByIdentifier(email);
        if (userId == null) return;

        serieRatingRepository.findBySerieIdAndUserId(serieId, userId).ifPresent(r -> {
            r.setRewatchCount((r.getRewatchCount() != null ? r.getRewatchCount() : 0) + 1);
            serieRatingRepository.save(r);
            log.info("Rewatch incrementado para série {} do usuário {}", serieId, email);
        });
    }

    @Transactional
    public void updateProgress(String serieId, String email, int watchedEpisodes, int totalEpisodes) {
        Long userId = authService.getUserIdByIdentifier(email);
        if (userId == null) return;

        serieRatingRepository.findBySerieIdAndUserId(serieId, userId).ifPresent(r -> {
            r.setWatchedEpisodes(watchedEpisodes);
            r.setTotalEpisodes(totalEpisodes);
            serieRatingRepository.save(r);
            log.info("Progresso atualizado para série {} ({} / {})", serieId, watchedEpisodes, totalEpisodes);
        });
    }

    private List<RatingSerieResponseDTO> enrichWithCatalog(List<RatingSerie> ratings) {
        if (ratings == null || ratings.isEmpty()) return List.of();
        List<String> serieIds = ratings.stream()
                .map(RatingSerie::getSerieId)
                .filter(Objects::nonNull)
                .distinct()
                .toList();

        Map<String, Serie> catalogMap = new HashMap<>();
        if (!serieIds.isEmpty()) {
            try {
                for (Serie s : catalogSerieRepository.findBySerieIdIn(serieIds)) {
                    if (s != null && s.getSerieId() != null) {
                        catalogMap.put(s.getSerieId(), s);
                    }
                }
            } catch (Exception e) {
                log.warn("Erro ao buscar catalogo de séries para avaliacoes: {}", e.getMessage());
            }
        }

        return ratings.stream().map(r -> {
            Serie cat = catalogMap.get(r.getSerieId());
            return toDto(r, cat != null ? cat.getTitle() : null, cat != null ? cat.getPosterPath() : null);
        }).toList();
    }

    private RatingSerieResponseDTO toDto(RatingSerie r, String title, String posterPath) {
        return RatingSerieResponseDTO.builder()
                .id(r.getId())
                .serieId(r.getSerieId())
                .title(title)
                .posterPath(posterPath)
                .rating(r.getRating())
                .comment(r.getComment())
                .rewatchCount(r.getRewatchCount() != null ? r.getRewatchCount() : 0)
                .watchedEpisodes(r.getWatchedEpisodes() != null ? r.getWatchedEpisodes() : 0)
                .totalEpisodes(r.getTotalEpisodes() != null ? r.getTotalEpisodes() : 0)
                .createdAt(r.getCreatedAt())
                .modifiedAt(r.getModifiedAt())
                .build();
    }
}
