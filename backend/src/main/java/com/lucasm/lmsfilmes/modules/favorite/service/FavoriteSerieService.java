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

    public List<Serie> getFavoriteSeries(String email) {
        Long userId = authService.getUserIdByIdentifier(email);
        if (userId == null) return List.of();

        List<FavoriteSerie> favs = favoriteSerieRepository.findByUserIdAndFavoriteTrue(userId);
        if (favs.isEmpty()) return List.of();

        List<String> serieIds = favs.stream().map(FavoriteSerie::getSerieId).toList();
        Map<String, Serie> catalogMap = catalogSerieRepository.findBySerieIdIn(serieIds).stream()
                .collect(Collectors.toMap(Serie::getSerieId, Function.identity(), (a, b) -> a));

        return serieIds.stream()
                .map(id -> catalogMap.getOrDefault(id, new Serie(id, "Série " + id, null)))
                .toList();
    }
}
