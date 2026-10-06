package com.lucasm.lmsfilmes.modules.catalog.controller;

import com.lucasm.lmsfilmes.modules.catalog.dto.EpisodeDetailDTO;
import com.lucasm.lmsfilmes.modules.catalog.dto.SeasonDTO;
import com.lucasm.lmsfilmes.modules.catalog.dto.SeriesDTO;
import com.lucasm.lmsfilmes.modules.catalog.dto.TmdbPageDTO;
import com.lucasm.lmsfilmes.modules.catalog.service.SerieService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping({"/series", "/lms-filmes/series", "/lmsfilmes/series"})
@RequiredArgsConstructor
public class SerieController {

    private final SerieService serieService;

    @GetMapping("/popular")
    public ResponseEntity<TmdbPageDTO<SeriesDTO>> getPopular(@RequestParam(defaultValue = "1") int page) {
        return ResponseEntity.ok(serieService.getPopularSeries(page));
    }

    @GetMapping("/airing-today")
    public ResponseEntity<TmdbPageDTO<SeriesDTO>> getAiringToday(@RequestParam(defaultValue = "1") int page) {
        return ResponseEntity.ok(serieService.getAiringTodaySeries(page));
    }

    @GetMapping("/on-the-air")
    public ResponseEntity<TmdbPageDTO<SeriesDTO>> getOnTheAir(@RequestParam(defaultValue = "1") int page) {
        return ResponseEntity.ok(serieService.getOnTheAirSeries(page));
    }

    @GetMapping("/top-rated")
    public ResponseEntity<TmdbPageDTO<SeriesDTO>> getTopRated(@RequestParam(defaultValue = "1") int page) {
        return ResponseEntity.ok(serieService.getTopRatedSeries(page));
    }

    @GetMapping("/search")
    public ResponseEntity<TmdbPageDTO<SeriesDTO>> search(
            @RequestParam String query,
            @RequestParam(defaultValue = "1") int page) {
        return ResponseEntity.ok(serieService.searchSeries(query, page));
    }

    @GetMapping("/{serieId}")
    public ResponseEntity<SeriesDTO> getDetails(
            @PathVariable String serieId,
            @RequestParam(defaultValue = "false") boolean includeRecommendations) {
        return ResponseEntity.ok(serieService.getSeriesDetails(serieId, includeRecommendations));
    }

    @GetMapping("/batch")
    public ResponseEntity<Map<String, SeriesDTO>> getBatch(@RequestParam List<String> ids) {
        return ResponseEntity.ok(serieService.getSeriesBatch(ids));
    }

    @GetMapping("/{serieId}/season/{seasonNumber}")
    public ResponseEntity<SeasonDTO> getSeasonDetails(
            @PathVariable String serieId,
            @PathVariable int seasonNumber) {
        return ResponseEntity.ok(serieService.getSeasonDetails(serieId, seasonNumber));
    }

    @GetMapping("/{serieId}/season/{seasonNumber}/episode/{episodeNumber}")
    public ResponseEntity<EpisodeDetailDTO> getEpisodeDetails(
            @PathVariable String serieId,
            @PathVariable int seasonNumber,
            @PathVariable int episodeNumber) {
        return ResponseEntity.ok(serieService.getEpisodeDetails(serieId, seasonNumber, episodeNumber));
    }
}
