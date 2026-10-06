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
@RequestMapping({
        "/rate/movies", "/lms-rating/rate/movies", "/lmsrating/rate/movies",
        "/rate/movie", "/lms-rating/rate/movie", "/lmsrating/rate/movie"
})
@RequiredArgsConstructor
public class RateMovieController {

    private final RateMovieService rateMovieService;

    @PostMapping
    public ResponseEntity<RatingMovieResponseDTO> rateMovie(
            @Valid @RequestBody RatingRequestDTO request,
            Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(rateMovieService.rateMovie(request, authentication.getName()));
    }

    @GetMapping({"", "/user"})
    public ResponseEntity<List<RatingMovieResponseDTO>> getRatedMovies(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            return ResponseEntity.ok(List.of());
        }
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
        if (authentication == null || authentication.getName() == null) {
            return ResponseEntity.ok(Page.empty());
        }
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(rateMovieService.getRatedMoviesPaged(authentication.getName(), pageable, minRating, maxRating, title));
    }

    @GetMapping("/{movieId:[0-9]+}")
    public ResponseEntity<?> getMovieRating(
            @PathVariable String movieId,
            Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            return ResponseEntity.ok().build();
        }
        RatingMovieResponseDTO dto = rateMovieService.getMovieRating(movieId, authentication.getName());
        return ResponseEntity.ok(dto);
    }

    @DeleteMapping("/{movieId}")
    public ResponseEntity<Map<String, Boolean>> deleteMovieRating(
            @PathVariable String movieId,
            Authentication authentication) {
        if (authentication != null && authentication.getName() != null) {
            rateMovieService.deleteMovieRating(movieId, authentication.getName());
        }
        return ResponseEntity.ok(Map.of("success", true));
    }

    @GetMapping("/status/batch")
    public ResponseEntity<Map<String, RatingStatusDTO>> getRatingStatuses(
            @RequestParam List<String> movieIds,
            Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            return ResponseEntity.ok(Map.of());
        }
        return ResponseEntity.ok(rateMovieService.getRatingStatuses(authentication.getName(), movieIds));
    }
}
