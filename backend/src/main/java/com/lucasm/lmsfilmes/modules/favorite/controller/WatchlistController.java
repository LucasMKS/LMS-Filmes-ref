package com.lucasm.lmsfilmes.modules.favorite.controller;

import com.lucasm.lmsfilmes.modules.favorite.dto.WatchlistStatusResponse;
import com.lucasm.lmsfilmes.modules.favorite.model.WatchlistMovie;
import com.lucasm.lmsfilmes.modules.favorite.model.WatchlistSerie;
import com.lucasm.lmsfilmes.modules.favorite.model.WatchlistStatus;
import com.lucasm.lmsfilmes.modules.favorite.service.WatchlistService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping({"/watchlist", "/lms-favorite/watchlist", "/lmsfavorite/watchlist"})
@RequiredArgsConstructor
public class WatchlistController {

    private final WatchlistService watchlistService;

    // --- FILMES ---

    @PostMapping("/movies")
    public ResponseEntity<WatchlistStatusResponse> toggleMovieWatchlist(
            @RequestParam String movieId,
            @RequestParam(required = false) WatchlistStatus status,
            Authentication authentication) {
        return ResponseEntity.ok(watchlistService.toggleMovieWatchlist(movieId, status, authentication.getName()));
    }

    @PatchMapping("/movies/status")
    public ResponseEntity<WatchlistStatusResponse> updateMovieStatus(
            @RequestParam String movieId,
            @RequestParam WatchlistStatus status,
            Authentication authentication) {
        return ResponseEntity.ok(watchlistService.updateMovieStatus(movieId, status, authentication.getName()));
    }

    @GetMapping("/movies/status")
    public ResponseEntity<WatchlistStatusResponse> getMovieWatchlistStatus(
            @RequestParam String movieId,
            Authentication authentication) {
        return ResponseEntity.ok(watchlistService.getMovieWatchlistStatus(movieId, authentication.getName()));
    }

    @GetMapping("/movies/status/batch")
    public ResponseEntity<Map<String, WatchlistStatusResponse>> getMovieWatchlistStatuses(
            @RequestParam List<String> movieIds,
            Authentication authentication) {
        return ResponseEntity.ok(watchlistService.getMovieWatchlistStatuses(movieIds, authentication.getName()));
    }

    @GetMapping("/movies")
    public ResponseEntity<List<WatchlistMovie>> getUserWatchlistMovies(Authentication authentication) {
        return ResponseEntity.ok(watchlistService.getUserWatchlistMovies(authentication.getName()));
    }

    // --- SÉRIES ---

    @PostMapping("/series")
    public ResponseEntity<WatchlistStatusResponse> toggleSerieWatchlist(
            @RequestParam String serieId,
            @RequestParam(required = false) WatchlistStatus status,
            Authentication authentication) {
        return ResponseEntity.ok(watchlistService.toggleSerieWatchlist(serieId, status, authentication.getName()));
    }

    @PatchMapping("/series/status")
    public ResponseEntity<WatchlistStatusResponse> updateSerieStatus(
            @RequestParam String serieId,
            @RequestParam WatchlistStatus status,
            Authentication authentication) {
        return ResponseEntity.ok(watchlistService.updateSerieStatus(serieId, status, authentication.getName()));
    }

    @GetMapping("/series/status")
    public ResponseEntity<WatchlistStatusResponse> getSerieWatchlistStatus(
            @RequestParam String serieId,
            Authentication authentication) {
        return ResponseEntity.ok(watchlistService.getSerieWatchlistStatus(serieId, authentication.getName()));
    }

    @GetMapping("/series/status/batch")
    public ResponseEntity<Map<String, WatchlistStatusResponse>> getSerieWatchlistStatuses(
            @RequestParam List<String> serieIds,
            Authentication authentication) {
        return ResponseEntity.ok(watchlistService.getSerieWatchlistStatuses(serieIds, authentication.getName()));
    }

    @GetMapping("/series")
    public ResponseEntity<List<WatchlistSerie>> getUserWatchlistSeries(Authentication authentication) {
        return ResponseEntity.ok(watchlistService.getUserWatchlistSeries(authentication.getName()));
    }
}
