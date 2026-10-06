package com.lucasm.lmsfilmes.modules.favorite.service;

import com.lucasm.lmsfilmes.core.exception.ResourceNotFoundException;
import com.lucasm.lmsfilmes.modules.auth.service.AuthService;
import com.lucasm.lmsfilmes.modules.catalog.model.Serie;
import com.lucasm.lmsfilmes.modules.catalog.repository.SerieRepository;
import com.lucasm.lmsfilmes.modules.favorite.model.FavoriteSerie;
import com.lucasm.lmsfilmes.modules.favorite.repository.FavoriteSerieRepository;
import com.lucasm.lmsfilmes.shared.event.CatalogSyncEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class FavoriteSerieService {

    private final FavoriteSerieRepository favoriteSerieRepository;
    private final SerieRepository catalogSerieRepository;
    private final AuthService authService;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional
    public boolean toggleFavorite(String serieId, String email) {
        Long userId = authService.getUserIdByIdentifier(email);
        if (userId == null) throw new ResourceNotFoundException("Usuário não encontrado: " + email);

        Optional<FavoriteSerie> opt = favoriteSerieRepository.findByUserIdAndSerieId(userId, serieId);
        if (opt.isPresent()) {
            FavoriteSerie fav = opt.get();
            fav.setFavorite(!fav.isFavorite());
            favoriteSerieRepository.save(fav);
            return fav.isFavorite();
        } else {
            FavoriteSerie fav = new FavoriteSerie();
            fav.setUserId(userId);
            fav.setSerieId(serieId);
            fav.setFavorite(true);
            favoriteSerieRepository.save(fav);

            // Sincroniza em memória
            eventPublisher.publishEvent(new CatalogSyncEvent(serieId, null, null, true));
            return true;
        }
    }

    public boolean getFavoriteStatus(String serieId, String email) {
        Long userId = authService.getUserIdByIdentifier(email);
        if (userId == null) return false;
        return favoriteSerieRepository.existsByUserIdAndSerieIdAndFavoriteTrue(userId, serieId);
    }

    @Transactional
    public boolean removeFavorite(String serieId, String email) {
        Long userId = authService.getUserIdByIdentifier(email);
        if (userId == null) return false;

        Optional<FavoriteSerie> opt = favoriteSerieRepository.findByUserIdAndSerieId(userId, serieId);
        if (opt.isPresent()) {
            favoriteSerieRepository.delete(opt.get());
            return true;
        }
        return false;
    }

    public Map<String, Boolean> getFavoriteStatuses(List<String> serieIds, String email) {
        if (serieIds == null || serieIds.isEmpty()) return Map.of();
        Long userId = authService.getUserIdByIdentifier(email);
        if (userId == null) return Map.of();

        List<FavoriteSerie> list = favoriteSerieRepository.findByUserIdAndSerieIdIn(userId, serieIds);
        Map<String, Boolean> map = new HashMap<>();
        for (String id : serieIds) {
            map.put(id, false);
        }
        for (FavoriteSerie fav : list) {
            map.put(fav.getSerieId(), fav.isFavorite());
        }
        return map;
    }

    public List<com.lucasm.lmsfilmes.modules.favorite.dto.FavoriteSerieResponseDTO> getFavoriteSeries(String email) {
        Long userId = authService.getUserIdByIdentifier(email);
        if (userId == null) return List.of();

        List<FavoriteSerie> favs;
        try {
            favs = favoriteSerieRepository.findByUserIdAndFavoriteTrue(userId);
        } catch (Exception e) {
            log.warn("Erro ao buscar séries favoritas ativas: {}. Usando busca simples por userId.", e.getMessage());
            favs = favoriteSerieRepository.findByUserId(userId);
        }
        if (favs == null || favs.isEmpty()) return List.of();

        List<String> serieIds = favs.stream()
                .map(FavoriteSerie::getSerieId)
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
                log.warn("Erro ao buscar séries do catalogo: {}", e.getMessage());
            }
        }

        return favs.stream()
                .filter(f -> f.getSerieId() != null && (f.getFavorite() == null || f.isFavorite()))
                .map(f -> {
                    Serie cat = catalogMap.get(f.getSerieId());
                    return com.lucasm.lmsfilmes.modules.favorite.dto.FavoriteSerieResponseDTO.builder()
                            .id(f.getId())
                            .userId(f.getUserId())
                            .serieId(f.getSerieId())
                            .title(cat != null ? cat.getTitle() : "Série " + f.getSerieId())
                            .posterPath(cat != null ? cat.getPosterPath() : null)
                            .favorite(f.getFavorite())
                            .build();
                })
                .toList();
    }
}
