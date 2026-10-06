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
@RequestMapping({
        "/favorite/movies", "/lms-favorite/favorite/movies", "/lmsfavorite/favorite/movies",
        "/favorite/movie", "/lms-favorite/favorite/movie", "/lmsfavorite/favorite/movie"
})
@RequiredArgsConstructor
public class FavoriteMovieController {

    private final FavoriteMovieService favoriteMovieService;

    @PostMapping
    public ResponseEntity<FavoriteStatusResponse> toggleFavorite(
            @RequestParam(required = false) String movieId,
            @RequestBody(required = false) Map<String, Object> body,
            Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED).build();
        }
        String id = movieId;
        if (id == null && body != null && body.get("movieId") != null) {
            id = String.valueOf(body.get("movieId"));
        }
        boolean isFav = favoriteMovieService.toggleFavorite(id, authentication.getName());
        return ResponseEntity.ok(new FavoriteStatusResponse(isFav));
    }

    @GetMapping({"/check/{movieId}", "/status/{movieId}"})
    public ResponseEntity<FavoriteStatusResponse> checkFavorite(
            @PathVariable String movieId,
            Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            return ResponseEntity.ok(new FavoriteStatusResponse(false));
        }
        boolean isFav = favoriteMovieService.getFavoriteStatus(movieId, authentication.getName());
        return ResponseEntity.ok(new FavoriteStatusResponse(isFav));
    }

    @DeleteMapping("/{movieId}")
    public ResponseEntity<Map<String, Boolean>> removeFavorite(
            @PathVariable String movieId,
            Authentication authentication) {
        if (authentication != null && authentication.getName() != null) {
            favoriteMovieService.removeFavorite(movieId, authentication.getName());
        }
        return ResponseEntity.ok(Map.of("success", true));
    }

    @GetMapping("/status")
    public ResponseEntity<Boolean> getFavoriteStatus(
            @RequestParam String movieId,
            Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            return ResponseEntity.ok(false);
        }
        return ResponseEntity.ok(favoriteMovieService.getFavoriteStatus(movieId, authentication.getName()));
    }

    @GetMapping("/status/batch")
    public ResponseEntity<Map<String, Boolean>> getFavoriteStatuses(
            @RequestParam List<String> movieIds,
            Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            return ResponseEntity.ok(Map.of());
        }
        return ResponseEntity.ok(favoriteMovieService.getFavoriteStatuses(movieIds, authentication.getName()));
    }

    @GetMapping
    public ResponseEntity<List<com.lucasm.lmsfilmes.modules.favorite.dto.FavoriteMovieResponseDTO>> getFavoriteMovies(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            return ResponseEntity.ok(List.of());
        }
        List<com.lucasm.lmsfilmes.modules.favorite.dto.FavoriteMovieResponseDTO> list = favoriteMovieService.getFavoriteMovies(authentication.getName());
        return ResponseEntity.ok(list);
    }
}
