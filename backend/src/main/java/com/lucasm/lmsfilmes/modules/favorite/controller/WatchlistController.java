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

    @PostMapping({"/movies", "/movie"})
    public ResponseEntity<WatchlistStatusResponse> toggleOrSetMovieWatchlist(
            @RequestParam(required = false) String movieId,
            @RequestParam(required = false) Object status,
            @RequestBody(required = false) Map<String, Object> body,
            Authentication authentication) {
        String id = movieId;
        Object st = status;
        if (id == null && body != null && body.get("movieId") != null) {
            id = String.valueOf(body.get("movieId"));
        }
        if (st == null && body != null && body.get("status") != null) {
            st = body.get("status");
        }
        WatchlistStatus parsed = WatchlistService.parseStatus(st);
        return ResponseEntity.ok(watchlistService.toggleMovieWatchlist(id, parsed, authentication.getName()));
    }

    @PatchMapping({"/movies/status", "/movie/status"})
    public ResponseEntity<WatchlistStatusResponse> updateMovieStatus(
            @RequestParam(required = false) String movieId,
            @RequestParam(required = false) Object status,
            @RequestBody(required = false) Map<String, Object> body,
            Authentication authentication) {
        String id = movieId;
        Object st = status;
        if (id == null && body != null && body.get("movieId") != null) {
            id = String.valueOf(body.get("movieId"));
        }
        if (st == null && body != null && body.get("status") != null) {
            st = body.get("status");
        }
        WatchlistStatus parsed = WatchlistService.parseStatus(st);
        return ResponseEntity.ok(watchlistService.updateMovieStatus(id, parsed, authentication.getName()));
    }

    @GetMapping({"/movies/status", "/movie/status"})
    public ResponseEntity<WatchlistStatusResponse> getMovieWatchlistStatusParam(
            @RequestParam String movieId,
            Authentication authentication) {
        return ResponseEntity.ok(watchlistService.getMovieWatchlistStatus(movieId, authentication.getName()));
    }

    @GetMapping({"/movies/status/{movieId}", "/movie/status/{movieId}"})
    public ResponseEntity<WatchlistStatusResponse> getMovieWatchlistStatus(
            @PathVariable String movieId,
            Authentication authentication) {
        return ResponseEntity.ok(watchlistService.getMovieWatchlistStatus(movieId, authentication.getName()));
    }

    @DeleteMapping({"/movies/{movieId}", "/movie/{movieId}"})
    public ResponseEntity<Map<String, Boolean>> removeMovieWatchlist(
            @PathVariable String movieId,
            Authentication authentication) {
        watchlistService.removeMovieFromWatchlist(movieId, authentication.getName());
        return ResponseEntity.ok(Map.of("success", true));
    }

    @GetMapping("/movies/status/batch")
    public ResponseEntity<Map<String, WatchlistStatusResponse>> getMovieWatchlistStatuses(
            @RequestParam List<String> movieIds,
            Authentication authentication) {
        return ResponseEntity.ok(watchlistService.getMovieWatchlistStatuses(movieIds, authentication.getName()));
    }

    @GetMapping({"/movies", "/movie"})
    public ResponseEntity<List<WatchlistMovie>> getUserWatchlistMovies(Authentication authentication) {
        return ResponseEntity.ok(watchlistService.getUserWatchlistMovies(authentication.getName()));
    }

    // --- SÉRIES ---

    @PostMapping({"/series", "/serie"})
    public ResponseEntity<WatchlistStatusResponse> toggleOrSetSerieWatchlist(
            @RequestParam(required = false) String serieId,
            @RequestParam(required = false) Object status,
            @RequestBody(required = false) Map<String, Object> body,
            Authentication authentication) {
        String id = serieId;
        Object st = status;
        if (id == null && body != null && body.get("serieId") != null) {
            id = String.valueOf(body.get("serieId"));
        }
        if (st == null && body != null && body.get("status") != null) {
            st = body.get("status");
        }
        WatchlistStatus parsed = WatchlistService.parseStatus(st);
        return ResponseEntity.ok(watchlistService.toggleSerieWatchlist(id, parsed, authentication.getName()));
    }

    @PatchMapping({"/series/status", "/serie/status"})
    public ResponseEntity<WatchlistStatusResponse> updateSerieStatus(
            @RequestParam(required = false) String serieId,
            @RequestParam(required = false) Object status,
            @RequestBody(required = false) Map<String, Object> body,
            Authentication authentication) {
        String id = serieId;
        Object st = status;
        if (id == null && body != null && body.get("serieId") != null) {
            id = String.valueOf(body.get("serieId"));
        }
        if (st == null && body != null && body.get("status") != null) {
            st = body.get("status");
        }
        WatchlistStatus parsed = WatchlistService.parseStatus(st);
        return ResponseEntity.ok(watchlistService.updateSerieStatus(id, parsed, authentication.getName()));
    }

    @GetMapping({"/series/status", "/serie/status"})
    public ResponseEntity<WatchlistStatusResponse> getSerieWatchlistStatusParam(
            @RequestParam String serieId,
            Authentication authentication) {
        return ResponseEntity.ok(watchlistService.getSerieWatchlistStatus(serieId, authentication.getName()));
    }

    @GetMapping({"/series/status/{serieId}", "/serie/status/{serieId}"})
    public ResponseEntity<WatchlistStatusResponse> getSerieWatchlistStatus(
            @PathVariable String serieId,
            Authentication authentication) {
        return ResponseEntity.ok(watchlistService.getSerieWatchlistStatus(serieId, authentication.getName()));
    }

    @DeleteMapping({"/series/{serieId}", "/serie/{serieId}"})
    public ResponseEntity<Map<String, Boolean>> removeSerieWatchlist(
            @PathVariable String serieId,
            Authentication authentication) {
        watchlistService.removeSerieFromWatchlist(serieId, authentication.getName());
        return ResponseEntity.ok(Map.of("success", true));
    }

    @GetMapping("/series/status/batch")
    public ResponseEntity<Map<String, WatchlistStatusResponse>> getSerieWatchlistStatuses(
            @RequestParam List<String> serieIds,
            Authentication authentication) {
        return ResponseEntity.ok(watchlistService.getSerieWatchlistStatuses(serieIds, authentication.getName()));
    }

    @GetMapping({"/series", "/serie"})
    public ResponseEntity<List<WatchlistSerie>> getUserWatchlistSeries(Authentication authentication) {
        return ResponseEntity.ok(watchlistService.getUserWatchlistSeries(authentication.getName()));
    }
}
