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
@RequestMapping({
        "/favorite/series", "/lms-favorite/favorite/series", "/lmsfavorite/favorite/series",
        "/favorite/serie", "/lms-favorite/favorite/serie", "/lmsfavorite/favorite/serie"
})
@RequiredArgsConstructor
public class FavoriteSerieController {

    private final FavoriteSerieService favoriteSerieService;

    @PostMapping
    public ResponseEntity<FavoriteStatusResponse> toggleFavorite(
            @RequestParam(required = false) String serieId,
            @RequestBody(required = false) Map<String, Object> body,
            Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED).build();
        }
        String id = serieId;
        if (id == null && body != null && body.get("serieId") != null) {
            id = String.valueOf(body.get("serieId"));
        }
        boolean isFav = favoriteSerieService.toggleFavorite(id, authentication.getName());
        return ResponseEntity.ok(new FavoriteStatusResponse(isFav));
    }

    @GetMapping({"/check/{serieId}", "/status/{serieId}"})
    public ResponseEntity<FavoriteStatusResponse> checkFavorite(
            @PathVariable String serieId,
            Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            return ResponseEntity.ok(new FavoriteStatusResponse(false));
        }
        boolean isFav = favoriteSerieService.getFavoriteStatus(serieId, authentication.getName());
        return ResponseEntity.ok(new FavoriteStatusResponse(isFav));
    }

    @DeleteMapping("/{serieId}")
    public ResponseEntity<Map<String, Boolean>> removeFavorite(
            @PathVariable String serieId,
            Authentication authentication) {
        if (authentication != null && authentication.getName() != null) {
            favoriteSerieService.removeFavorite(serieId, authentication.getName());
        }
        return ResponseEntity.ok(Map.of("success", true));
    }

    @GetMapping("/status")
    public ResponseEntity<Boolean> getFavoriteStatus(
            @RequestParam String serieId,
            Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            return ResponseEntity.ok(false);
        }
        return ResponseEntity.ok(favoriteSerieService.getFavoriteStatus(serieId, authentication.getName()));
    }

    @GetMapping("/status/batch")
    public ResponseEntity<Map<String, Boolean>> getFavoriteStatuses(
            @RequestParam List<String> serieIds,
            Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            return ResponseEntity.ok(Map.of());
        }
        return ResponseEntity.ok(favoriteSerieService.getFavoriteStatuses(serieIds, authentication.getName()));
    }

    @GetMapping
    public ResponseEntity<List<com.lucasm.lmsfilmes.modules.favorite.dto.FavoriteSerieResponseDTO>> getFavoriteSeries(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            return ResponseEntity.ok(List.of());
        }
        List<com.lucasm.lmsfilmes.modules.favorite.dto.FavoriteSerieResponseDTO> list = favoriteSerieService.getFavoriteSeries(authentication.getName());
        return ResponseEntity.ok(list);
    }
}
