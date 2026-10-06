package com.lucasm.lmsfilmes.modules.rating.controller;

import com.lucasm.lmsfilmes.modules.rating.dto.EpisodeRatingRequestDTO;
import com.lucasm.lmsfilmes.modules.rating.model.RatingEpisode;
import com.lucasm.lmsfilmes.modules.rating.service.RateEpisodeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping({
        "/rate/episodes", "/lms-rating/rate/episodes", "/lmsrating/rate/episodes",
        "/rate/episode", "/lms-rating/rate/episode", "/lmsrating/rate/episode"
})
@RequiredArgsConstructor
public class RateEpisodeController {

    private final RateEpisodeService rateEpisodeService;

    @PostMapping
    public ResponseEntity<RatingEpisode> rateEpisode(
            @Valid @RequestBody EpisodeRatingRequestDTO request,
            Authentication authentication) {
        return ResponseEntity.ok(rateEpisodeService.rateEpisode(request, authentication.getName()));
    }

    @GetMapping("/serie/{serieId}")
    public ResponseEntity<List<RatingEpisode>> getRatedEpisodes(
            @PathVariable String serieId,
            Authentication authentication) {
        return ResponseEntity.ok(rateEpisodeService.getRatedEpisodes(serieId, authentication.getName()));
    }

    @GetMapping("/serie/{serieId}/season/{seasonNumber}")
    public ResponseEntity<List<RatingEpisode>> getSeasonEpisodeRatings(
            @PathVariable String serieId,
            @PathVariable int seasonNumber,
            Authentication authentication) {
        return ResponseEntity.ok(rateEpisodeService.getSeasonEpisodeRatings(serieId, seasonNumber, authentication.getName()));
    }

    @GetMapping("/serie/{serieId}/season/{seasonNumber}/episode/{episodeNumber}")
    public ResponseEntity<RatingEpisode> getEpisodeRating(
            @PathVariable String serieId,
            @PathVariable int seasonNumber,
            @PathVariable int episodeNumber,
            Authentication authentication) {
        return ResponseEntity.ok(rateEpisodeService.getEpisodeRating(serieId, seasonNumber, episodeNumber, authentication.getName()));
    }

    @DeleteMapping("/serie/{serieId}/season/{seasonNumber}/episode/{episodeNumber}")
    public ResponseEntity<Void> deleteEpisodeRating(
            @PathVariable String serieId,
            @PathVariable int seasonNumber,
            @PathVariable int episodeNumber,
            Authentication authentication) {
        rateEpisodeService.deleteEpisodeRating(serieId, seasonNumber, episodeNumber, authentication.getName());
        return ResponseEntity.noContent().build();
    }
}
