package com.lucasm.lmsfilmes.modules.rating.controller;

import com.lucasm.lmsfilmes.modules.rating.dto.RatingMovieResponseDTO;
import com.lucasm.lmsfilmes.modules.rating.dto.RatingRequestDTO;
import com.lucasm.lmsfilmes.modules.rating.dto.RatingStatusDTO;
import com.lucasm.lmsfilmes.modules.rating.service.RateMovieService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping({"/rate/movies", "/lms-rating/rate/movies", "/lmsrating/rate/movies"})
@RequiredArgsConstructor
public class RateMovieController {

    private final RateMovieService rateMovieService;

    @PostMapping
    public ResponseEntity<RatingMovieResponseDTO> rateMovie(
            @Valid @RequestBody RatingRequestDTO request,
            Authentication authentication) {
        return ResponseEntity.ok(rateMovieService.rateMovie(request, authentication.getName()));
    }

    @GetMapping
    public ResponseEntity<List<RatingMovieResponseDTO>> getRatedMovies(Authentication authentication) {
        return ResponseEntity.ok(rateMovieService.getRatedMovies(authentication.getName()));
    }

    @GetMapping("/paged")
    public ResponseEntity<Page<RatingMovieResponseDTO>> getRatedMoviesPaged(
            Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) Double minRating,
            @RequestParam(required = false) Double maxRating,
            @RequestParam(required = false) String title) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(rateMovieService.getRatedMoviesPaged(authentication.getName(), pageable, minRating, maxRating, title));
    }

    @GetMapping("/{movieId}")
    public ResponseEntity<RatingMovieResponseDTO> getMovieRating(
            @PathVariable String movieId,
            Authentication authentication) {
        return ResponseEntity.ok(rateMovieService.getMovieRating(movieId, authentication.getName()));
    }

    @GetMapping("/status/batch")
    public ResponseEntity<Map<String, RatingStatusDTO>> getRatingStatuses(
            @RequestParam List<String> movieIds,
            Authentication authentication) {
        return ResponseEntity.ok(rateMovieService.getRatingStatuses(authentication.getName(), movieIds));
    }
}
