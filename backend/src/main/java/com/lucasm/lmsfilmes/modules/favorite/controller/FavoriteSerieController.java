package com.lucasm.lmsfilmes.modules.favorite.controller;

import com.lucasm.lmsfilmes.modules.catalog.model.Serie;
import com.lucasm.lmsfilmes.modules.favorite.dto.FavoriteStatusResponse;
import com.lucasm.lmsfilmes.modules.favorite.service.FavoriteSerieService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping({"/favorite/series", "/lms-favorite/favorite/series", "/lmsfavorite/favorite/series"})
@RequiredArgsConstructor
public class FavoriteSerieController {

    private final FavoriteSerieService favoriteSerieService;

    @PostMapping
    public ResponseEntity<FavoriteStatusResponse> toggleFavorite(
            @RequestParam String serieId,
            Authentication authentication) {
        boolean isFav = favoriteSerieService.toggleFavorite(serieId, authentication.getName());
        return ResponseEntity.ok(new FavoriteStatusResponse(isFav));
    }

    @GetMapping("/status")
    public ResponseEntity<Boolean> getFavoriteStatus(
            @RequestParam String serieId,
            Authentication authentication) {
        return ResponseEntity.ok(favoriteSerieService.getFavoriteStatus(serieId, authentication.getName()));
    }

    @GetMapping("/status/batch")
    public ResponseEntity<Map<String, Boolean>> getFavoriteStatuses(
            @RequestParam List<String> serieIds,
            Authentication authentication) {
        return ResponseEntity.ok(favoriteSerieService.getFavoriteStatuses(serieIds, authentication.getName()));
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getFavoriteSeries(Authentication authentication) {
        List<Serie> list = favoriteSerieService.getFavoriteSeries(authentication.getName());
        return ResponseEntity.ok(Map.of("data", list));
    }
}
