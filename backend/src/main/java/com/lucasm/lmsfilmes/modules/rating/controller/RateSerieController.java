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
@RequestMapping({
        "/rate/series", "/lms-rating/rate/series", "/lmsrating/rate/series",
        "/rate/serie", "/lms-rating/rate/serie", "/lmsrating/rate/serie"
})
@RequiredArgsConstructor
public class RateSerieController {

    private final RateSerieService rateSerieService;

    @PostMapping
    public ResponseEntity<RatingSerieResponseDTO> rateSerie(
            @Valid @RequestBody SerieRatingRequestDTO request,
            Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(rateSerieService.rateSerie(request, authentication.getName()));
    }

    @GetMapping({"", "/user"})
    public ResponseEntity<List<RatingSerieResponseDTO>> getRatedSeries(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            return ResponseEntity.ok(List.of());
        }
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
        if (authentication == null || authentication.getName() == null) {
            return ResponseEntity.ok(Page.empty());
        }
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(rateSerieService.getRatedSeriesPaged(authentication.getName(), pageable, minRating, maxRating, title));
    }

    @GetMapping("/{serieId:[0-9]+}")
    public ResponseEntity<?> getSerieRating(
            @PathVariable String serieId,
            Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            return ResponseEntity.ok().build();
        }
        RatingSerieResponseDTO dto = rateSerieService.getSerieRating(serieId, authentication.getName());
        return ResponseEntity.ok(dto);
    }

    @DeleteMapping("/{serieId}")
    public ResponseEntity<Map<String, Boolean>> deleteSerieRating(
            @PathVariable String serieId,
            Authentication authentication) {
        if (authentication != null && authentication.getName() != null) {
            rateSerieService.deleteSerieRating(serieId, authentication.getName());
        }
        return ResponseEntity.ok(Map.of("success", true));
    }

    @GetMapping("/status/batch")
    public ResponseEntity<Map<String, RatingStatusDTO>> getRatingStatuses(
            @RequestParam List<String> serieIds,
            Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            return ResponseEntity.ok(Map.of());
        }
        return ResponseEntity.ok(rateSerieService.getRatingStatuses(authentication.getName(), serieIds));
    }
}
