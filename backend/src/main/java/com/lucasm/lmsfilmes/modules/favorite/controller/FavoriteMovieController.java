package com.lucasm.lmsfilmes.modules.favorite.controller;

import com.lucasm.lmsfilmes.modules.catalog.model.Movie;
import com.lucasm.lmsfilmes.modules.favorite.dto.FavoriteStatusResponse;
import com.lucasm.lmsfilmes.modules.favorite.service.FavoriteMovieService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping({"/favorite/movies", "/lms-favorite/favorite/movies", "/lmsfavorite/favorite/movies"})
@RequiredArgsConstructor
public class FavoriteMovieController {

    private final FavoriteMovieService favoriteMovieService;

    @PostMapping
    public ResponseEntity<FavoriteStatusResponse> toggleFavorite(
            @RequestParam String movieId,
            Authentication authentication) {
        boolean isFav = favoriteMovieService.toggleFavorite(movieId, authentication.getName());
        return ResponseEntity.ok(new FavoriteStatusResponse(isFav));
    }

    @GetMapping("/status")
    public ResponseEntity<Boolean> getFavoriteStatus(
            @RequestParam String movieId,
            Authentication authentication) {
        return ResponseEntity.ok(favoriteMovieService.getFavoriteStatus(movieId, authentication.getName()));
    }

    @GetMapping("/status/batch")
    public ResponseEntity<Map<String, Boolean>> getFavoriteStatuses(
            @RequestParam List<String> movieIds,
            Authentication authentication) {
        return ResponseEntity.ok(favoriteMovieService.getFavoriteStatuses(movieIds, authentication.getName()));
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getFavoriteMovies(Authentication authentication) {
        List<Movie> list = favoriteMovieService.getFavoriteMovies(authentication.getName());
        return ResponseEntity.ok(Map.of("data", list));
    }
}
