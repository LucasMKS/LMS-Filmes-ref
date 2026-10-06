package com.lucasm.lmsfilmes.modules.favorite.service;

import com.lucasm.lmsfilmes.core.exception.ResourceNotFoundException;
import com.lucasm.lmsfilmes.modules.auth.service.AuthService;
import com.lucasm.lmsfilmes.modules.favorite.dto.WatchlistStatusResponse;
import com.lucasm.lmsfilmes.modules.favorite.model.WatchlistMovie;
import com.lucasm.lmsfilmes.modules.favorite.model.WatchlistSerie;
import com.lucasm.lmsfilmes.modules.favorite.model.WatchlistStatus;
import com.lucasm.lmsfilmes.modules.favorite.repository.WatchlistMovieRepository;
import com.lucasm.lmsfilmes.modules.favorite.repository.WatchlistSerieRepository;
import com.lucasm.lmsfilmes.shared.event.CatalogSyncEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class WatchlistService {

    private final WatchlistMovieRepository watchlistMovieRepository;
    private final WatchlistSerieRepository watchlistSerieRepository;
    private final AuthService authService;
    private final ApplicationEventPublisher eventPublisher;

    // --- FILMES ---

    @Transactional
    public WatchlistStatusResponse toggleMovieWatchlist(String movieId, WatchlistStatus status, String email) {
        Long userId = authService.getUserIdByIdentifier(email);
        if (userId == null) throw new ResourceNotFoundException("Usuário não encontrado: " + email);

        WatchlistStatus finalStatus = status != null ? status : WatchlistStatus.PLAN_TO_WATCH;
        Optional<WatchlistMovie> opt = watchlistMovieRepository.findByUserIdAndMovieId(userId, movieId);

        if (opt.isPresent()) {
            watchlistMovieRepository.delete(opt.get());
            return new WatchlistStatusResponse(false, null);
        } else {
            WatchlistMovie wm = new WatchlistMovie();
            wm.setUserId(userId);
            wm.setMovieId(movieId);
            wm.setStatus(finalStatus);
            watchlistMovieRepository.save(wm);

            eventPublisher.publishEvent(new CatalogSyncEvent(movieId, null, null, false));
            return new WatchlistStatusResponse(true, finalStatus);
        }
    }

    @Transactional
    public WatchlistStatusResponse updateMovieStatus(String movieId, WatchlistStatus status, String email) {
        Long userId = authService.getUserIdByIdentifier(email);
        if (userId == null) throw new ResourceNotFoundException("Usuário não encontrado: " + email);

        WatchlistMovie wm = watchlistMovieRepository.findByUserIdAndMovieId(userId, movieId)
                .orElseGet(() -> {
                    WatchlistMovie newWm = new WatchlistMovie();
                    newWm.setUserId(userId);
                    newWm.setMovieId(movieId);
                    return newWm;
                });

        wm.setStatus(status);
        watchlistMovieRepository.save(wm);
        eventPublisher.publishEvent(new CatalogSyncEvent(movieId, null, null, false));
        return new WatchlistStatusResponse(true, status);
    }

    public WatchlistStatusResponse getMovieWatchlistStatus(String movieId, String email) {
        Long userId = authService.getUserIdByIdentifier(email);
        if (userId == null) return new WatchlistStatusResponse(false, null);

        return watchlistMovieRepository.findByUserIdAndMovieId(userId, movieId)
                .map(wm -> new WatchlistStatusResponse(true, wm.getStatus()))
                .orElse(new WatchlistStatusResponse(false, null));
    }

    public Map<String, WatchlistStatusResponse> getMovieWatchlistStatuses(List<String> movieIds, String email) {
        if (movieIds == null || movieIds.isEmpty()) return Map.of();
        Long userId = authService.getUserIdByIdentifier(email);
        if (userId == null) return Map.of();

        List<WatchlistMovie> list = watchlistMovieRepository.findByUserIdAndMovieIdIn(userId, movieIds);
        Map<String, WatchlistStatusResponse> map = new HashMap<>();
        for (String id : movieIds) {
            map.put(id, new WatchlistStatusResponse(false, null));
        }
        for (WatchlistMovie wm : list) {
            map.put(wm.getMovieId(), new WatchlistStatusResponse(true, wm.getStatus()));
        }
        return map;
    }

    public List<WatchlistMovie> getUserWatchlistMovies(String email) {
        Long userId = authService.getUserIdByIdentifier(email);
        if (userId == null) return List.of();
        return watchlistMovieRepository.findByUserIdOrderByAddedAtDesc(userId);
    }

    // --- SÉRIES ---

    @Transactional
    public WatchlistStatusResponse toggleSerieWatchlist(String serieId, WatchlistStatus status, String email) {
        Long userId = authService.getUserIdByIdentifier(email);
        if (userId == null) throw new ResourceNotFoundException("Usuário não encontrado: " + email);

        WatchlistStatus finalStatus = status != null ? status : WatchlistStatus.PLAN_TO_WATCH;
        Optional<WatchlistSerie> opt = watchlistSerieRepository.findByUserIdAndSerieId(userId, serieId);

        if (opt.isPresent()) {
            watchlistSerieRepository.delete(opt.get());
            return new WatchlistStatusResponse(false, null);
        } else {
            WatchlistSerie ws = new WatchlistSerie();
            ws.setUserId(userId);
            ws.setSerieId(serieId);
            ws.setStatus(finalStatus);
            watchlistSerieRepository.save(ws);

            eventPublisher.publishEvent(new CatalogSyncEvent(serieId, null, null, true));
            return new WatchlistStatusResponse(true, finalStatus);
        }
    }

    @Transactional
    public WatchlistStatusResponse updateSerieStatus(String serieId, WatchlistStatus status, String email) {
        Long userId = authService.getUserIdByIdentifier(email);
        if (userId == null) throw new ResourceNotFoundException("Usuário não encontrado: " + email);

        WatchlistSerie ws = watchlistSerieRepository.findByUserIdAndSerieId(userId, serieId)
                .orElseGet(() -> {
                    WatchlistSerie newWs = new WatchlistSerie();
                    newWs.setUserId(userId);
                    newWs.setSerieId(serieId);
                    return newWs;
                });

        ws.setStatus(status);
        watchlistSerieRepository.save(ws);
        eventPublisher.publishEvent(new CatalogSyncEvent(serieId, null, null, true));
        return new WatchlistStatusResponse(true, status);
    }

    public WatchlistStatusResponse getSerieWatchlistStatus(String serieId, String email) {
        Long userId = authService.getUserIdByIdentifier(email);
        if (userId == null) return new WatchlistStatusResponse(false, null);

        return watchlistSerieRepository.findByUserIdAndSerieId(userId, serieId)
                .map(ws -> new WatchlistStatusResponse(true, ws.getStatus()))
                .orElse(new WatchlistStatusResponse(false, null));
    }

    public Map<String, WatchlistStatusResponse> getSerieWatchlistStatuses(List<String> serieIds, String email) {
        if (serieIds == null || serieIds.isEmpty()) return Map.of();
        Long userId = authService.getUserIdByIdentifier(email);
        if (userId == null) return Map.of();

        List<WatchlistSerie> list = watchlistSerieRepository.findByUserIdAndSerieIdIn(userId, serieIds);
        Map<String, WatchlistStatusResponse> map = new HashMap<>();
        for (String id : serieIds) {
            map.put(id, new WatchlistStatusResponse(false, null));
        }
        for (WatchlistSerie ws : list) {
            map.put(ws.getSerieId(), new WatchlistStatusResponse(true, ws.getStatus()));
        }
        return map;
    }

    public List<WatchlistSerie> getUserWatchlistSeries(String email) {
        Long userId = authService.getUserIdByIdentifier(email);
        if (userId == null) return List.of();
        return watchlistSerieRepository.findByUserIdOrderByAddedAtDesc(userId);
    }

    @Transactional
    public void removeMovieFromWatchlist(String movieId, String email) {
        Long userId = authService.getUserIdByIdentifier(email);
        if (userId != null) {
            watchlistMovieRepository.findByUserIdAndMovieId(userId, movieId)
                    .ifPresent(watchlistMovieRepository::delete);
        }
    }

    @Transactional
    public void removeSerieFromWatchlist(String serieId, String email) {
        Long userId = authService.getUserIdByIdentifier(email);
        if (userId != null) {
            watchlistSerieRepository.findByUserIdAndSerieId(userId, serieId)
                    .ifPresent(watchlistSerieRepository::delete);
        }
    }

    public static WatchlistStatus parseStatus(Object status) {
        if (status == null) return WatchlistStatus.PLAN_TO_WATCH;
        if (status instanceof WatchlistStatus ws) return ws;
        String s = status.toString().trim().toUpperCase();
        if ("PLANNING".equals(s)) return WatchlistStatus.PLAN_TO_WATCH;
        try {
            return WatchlistStatus.valueOf(s);
        } catch (Exception e) {
            return WatchlistStatus.PLAN_TO_WATCH;
        }
    }
}
