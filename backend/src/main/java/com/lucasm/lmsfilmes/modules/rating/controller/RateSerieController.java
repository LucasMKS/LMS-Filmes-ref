package com.lucasm.lmsfilmes.modules.rating.controller;

import com.lucasm.lmsfilmes.modules.rating.dto.RatingSerieResponseDTO;
import com.lucasm.lmsfilmes.modules.rating.dto.RatingStatusDTO;
import com.lucasm.lmsfilmes.modules.rating.dto.SerieRatingRequestDTO;
import com.lucasm.lmsfilmes.modules.rating.service.RateSerieService;
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
@RequestMapping({"/rate/series", "/lms-rating/rate/series", "/lmsrating/rate/series"})
@RequiredArgsConstructor
public class RateSerieController {

    private final RateSerieService rateSerieService;

    @PostMapping
    public ResponseEntity<RatingSerieResponseDTO> rateSerie(
            @Valid @RequestBody SerieRatingRequestDTO request,
            Authentication authentication) {
        return ResponseEntity.ok(rateSerieService.rateSerie(request, authentication.getName()));
    }

    @GetMapping
    public ResponseEntity<List<RatingSerieResponseDTO>> getRatedSeries(Authentication authentication) {
        return ResponseEntity.ok(rateSerieService.getRatedSeries(authentication.getName()));
    }

    @GetMapping("/paged")
    public ResponseEntity<Page<RatingSerieResponseDTO>> getRatedSeriesPaged(
            Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) Double minRating,
            @RequestParam(required = false) Double maxRating,
            @RequestParam(required = false) String title) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(rateSerieService.getRatedSeriesPaged(authentication.getName(), pageable, minRating, maxRating, title));
    }

    @GetMapping("/{serieId}")
    public ResponseEntity<RatingSerieResponseDTO> getSerieRating(
            @PathVariable String serieId,
            Authentication authentication) {
        return ResponseEntity.ok(rateSerieService.getSerieRating(serieId, authentication.getName()));
    }

    @GetMapping("/status/batch")
    public ResponseEntity<Map<String, RatingStatusDTO>> getRatingStatuses(
            @RequestParam List<String> serieIds,
            Authentication authentication) {
        return ResponseEntity.ok(rateSerieService.getRatingStatuses(authentication.getName(), serieIds));
    }
}
