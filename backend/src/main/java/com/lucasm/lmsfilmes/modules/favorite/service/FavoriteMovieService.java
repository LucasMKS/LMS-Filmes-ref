package com.lucasm.lmsfilmes.modules.favorite.service;

import com.lucasm.lmsfilmes.core.exception.ResourceNotFoundException;
import com.lucasm.lmsfilmes.modules.auth.service.AuthService;
import com.lucasm.lmsfilmes.modules.catalog.model.Movie;
import com.lucasm.lmsfilmes.modules.catalog.repository.MovieRepository;
import com.lucasm.lmsfilmes.modules.favorite.model.FavoriteMovie;
import com.lucasm.lmsfilmes.modules.favorite.repository.FavoriteMovieRepository;
import com.lucasm.lmsfilmes.shared.event.CatalogSyncEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class FavoriteMovieService {

    private final FavoriteMovieRepository favoriteMovieRepository;
    private final MovieRepository catalogMovieRepository;
    private final AuthService authService;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional
    public boolean toggleFavorite(String movieId, String email) {
        Long userId = authService.getUserIdByIdentifier(email);
        if (userId == null) throw new ResourceNotFoundException("Usuário não encontrado: " + email);

        Optional<FavoriteMovie> opt = favoriteMovieRepository.findByUserIdAndMovieId(userId, movieId);
        if (opt.isPresent()) {
            FavoriteMovie fav = opt.get();
            fav.setFavorite(!fav.isFavorite());
            favoriteMovieRepository.save(fav);
            return fav.isFavorite();
        } else {
            FavoriteMovie fav = new FavoriteMovie();
            fav.setUserId(userId);
            fav.setMovieId(movieId);
            fav.setFavorite(true);
            favoriteMovieRepository.save(fav);

            // Sincroniza em memória
            eventPublisher.publishEvent(new CatalogSyncEvent(movieId, null, null, false));
            return true;
        }
    }

    public boolean getFavoriteStatus(String movieId, String email) {
        Long userId = authService.getUserIdByIdentifier(email);
        if (userId == null) return false;
        return favoriteMovieRepository.existsByUserIdAndMovieIdAndFavoriteTrue(userId, movieId);
    }

    public Map<String, Boolean> getFavoriteStatuses(List<String> movieIds, String email) {
        if (movieIds == null || movieIds.isEmpty()) return Map.of();
        Long userId = authService.getUserIdByIdentifier(email);
        if (userId == null) return Map.of();

        List<FavoriteMovie> list = favoriteMovieRepository.findByUserIdAndMovieIdIn(userId, movieIds);
        Map<String, Boolean> map = new HashMap<>();
        for (String id : movieIds) {
            map.put(id, false);
        }
        for (FavoriteMovie fav : list) {
            map.put(fav.getMovieId(), fav.isFavorite());
        }
        return map;
    }

    public List<Movie> getFavoriteMovies(String email) {
        Long userId = authService.getUserIdByIdentifier(email);
        if (userId == null) return List.of();

        List<FavoriteMovie> favs = favoriteMovieRepository.findByUserIdAndFavoriteTrue(userId);
        if (favs.isEmpty()) return List.of();

        List<String> movieIds = favs.stream().map(FavoriteMovie::getMovieId).toList();
        Map<String, Movie> catalogMap = catalogMovieRepository.findByMovieIdIn(movieIds).stream()
                .collect(Collectors.toMap(Movie::getMovieId, Function.identity(), (a, b) -> a));

        return movieIds.stream()
                .map(id -> catalogMap.getOrDefault(id, new Movie(id, "Filme " + id, null)))
                .toList();
    }
}
