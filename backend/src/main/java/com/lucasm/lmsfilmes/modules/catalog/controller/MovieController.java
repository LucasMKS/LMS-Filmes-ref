package com.lucasm.lmsfilmes.modules.catalog.controller;

import com.lucasm.lmsfilmes.modules.catalog.dto.TmdbDTO;
import com.lucasm.lmsfilmes.modules.catalog.dto.TmdbPageDTO;
import com.lucasm.lmsfilmes.modules.catalog.dto.TmdbPersonCreditsDTO;
import com.lucasm.lmsfilmes.modules.catalog.dto.TmdbPersonDTO;
import com.lucasm.lmsfilmes.modules.catalog.service.MovieService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping({"/movies", "/lms-filmes/movies", "/lmsfilmes/movies"})
@RequiredArgsConstructor
public class MovieController {

    private final MovieService movieService;

    @GetMapping("/popular")
    public ResponseEntity<TmdbPageDTO<TmdbDTO>> getPopular(@RequestParam(defaultValue = "1") int page) {
        return ResponseEntity.ok(movieService.getPopularMovies(page));
    }

    @GetMapping("/now-playing")
    public ResponseEntity<TmdbPageDTO<TmdbDTO>> getNowPlaying(@RequestParam(defaultValue = "1") int page) {
        return ResponseEntity.ok(movieService.getNowPlayingMovies(page));
    }

    @GetMapping("/top-rated")
    public ResponseEntity<TmdbPageDTO<TmdbDTO>> getTopRated(@RequestParam(defaultValue = "1") int page) {
        return ResponseEntity.ok(movieService.getTopRatedMovies(page));
    }

    @GetMapping("/upcoming")
    public ResponseEntity<TmdbPageDTO<TmdbDTO>> getUpcoming(@RequestParam(defaultValue = "1") int page) {
        return ResponseEntity.ok(movieService.getUpcomingMovies(page));
    }

    @GetMapping("/search")
    public ResponseEntity<TmdbPageDTO<TmdbDTO>> search(
            @RequestParam String query,
            @RequestParam(defaultValue = "1") int page) {
        return ResponseEntity.ok(movieService.searchMovies(query, page));
    }

    @GetMapping("/{movieId}")
    public ResponseEntity<TmdbDTO> getDetails(
            @PathVariable String movieId,
            @RequestParam(defaultValue = "false") boolean includeRecommendations) {
        return ResponseEntity.ok(movieService.getMovieDetails(movieId, includeRecommendations));
    }

    @GetMapping("/{movieId}/recommendations")
    public ResponseEntity<TmdbPageDTO<TmdbDTO>> getRecommendations(@PathVariable String movieId) {
        return ResponseEntity.ok(movieService.getMovieRecommendations(movieId));
    }

    @GetMapping("/batch")
    public ResponseEntity<Map<String, TmdbDTO>> getBatch(@RequestParam List<String> ids) {
        return ResponseEntity.ok(movieService.getMoviesBatch(ids));
    }

    // Rotas de Pessoas / Atores (TMDB)
    @GetMapping({"/actors/popular", "/person/popular"})
    public ResponseEntity<TmdbPageDTO<TmdbPersonDTO>> getPopularActors(@RequestParam(defaultValue = "1") int page) {
        return ResponseEntity.ok(movieService.getPopularPeople(page));
    }

    @GetMapping({"/actors/search", "/person/search"})
    public ResponseEntity<TmdbPageDTO<TmdbPersonDTO>> searchActors(
            @RequestParam String query,
            @RequestParam(defaultValue = "1") int page) {
        return ResponseEntity.ok(movieService.searchPeople(query, page));
    }

    @GetMapping({"/actors/{personId}", "/person/{personId}"})
    public ResponseEntity<TmdbPersonDTO> getActorDetails(@PathVariable String personId) {
        return ResponseEntity.ok(movieService.getPersonDetails(personId));
    }

    @GetMapping({"/actors/{personId}/credits", "/person/{personId}/credits"})
    public ResponseEntity<TmdbPersonCreditsDTO> getActorCredits(@PathVariable String personId) {
        return ResponseEntity.ok(movieService.getPersonCredits(personId));
    }
}
