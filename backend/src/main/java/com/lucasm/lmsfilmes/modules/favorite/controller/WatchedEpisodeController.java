package com.lucasm.lmsfilmes.modules.favorite.controller;

import com.lucasm.lmsfilmes.modules.favorite.dto.WatchedEpisodeRequestDTO;
import com.lucasm.lmsfilmes.modules.favorite.model.WatchedEpisode;
import com.lucasm.lmsfilmes.modules.favorite.service.WatchedEpisodeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping({
        "/watched/episodes", "/lms-favorite/watched/episodes", "/lmsfavorite/watched/episodes",
        "/watchlist/watched-episodes", "/lms-favorite/watchlist/watched-episodes", "/lmsfavorite/watchlist/watched-episodes"
})
@RequiredArgsConstructor
public class WatchedEpisodeController {

    private final WatchedEpisodeService watchedEpisodeService;

    @PostMapping
    public ResponseEntity<WatchedEpisode> markAsWatched(
            @RequestBody WatchedEpisodeRequestDTO dto,
            Authentication authentication) {
        return ResponseEntity.ok(watchedEpisodeService.markAsWatched(dto, authentication.getName()));
    }

    @DeleteMapping
    public ResponseEntity<Void> unmarkAsWatched(
            @RequestParam(required = false) String serieId,
            @RequestParam(required = false) Integer seasonNumber,
            @RequestParam(required = false) Integer episodeNumber,
            @RequestBody(required = false) WatchedEpisodeRequestDTO bodyDto,
            Authentication authentication) {

        WatchedEpisodeRequestDTO dto = bodyDto != null ? bodyDto : new WatchedEpisodeRequestDTO(serieId, seasonNumber, episodeNumber);
        watchedEpisodeService.unmarkAsWatched(dto, authentication.getName());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/serie/{serieId}")
    public ResponseEntity<List<WatchedEpisode>> getWatchedEpisodes(
            @PathVariable String serieId,
            Authentication authentication) {
        return ResponseEntity.ok(watchedEpisodeService.getWatchedEpisodes(serieId, authentication.getName()));
    }

    @DeleteMapping("/serie/{serieId}/rewatch")
    public ResponseEntity<Void> clearForRewatch(
            @PathVariable String serieId,
            Authentication authentication) {
        watchedEpisodeService.clearEpisodesForRewatch(serieId, authentication.getName());
        return ResponseEntity.noContent().build();
    }
}
