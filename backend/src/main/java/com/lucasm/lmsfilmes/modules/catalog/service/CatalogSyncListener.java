package com.lucasm.lmsfilmes.modules.catalog.service;

import com.lucasm.lmsfilmes.modules.catalog.model.Movie;
import com.lucasm.lmsfilmes.modules.catalog.model.Serie;
import com.lucasm.lmsfilmes.modules.catalog.repository.MovieRepository;
import com.lucasm.lmsfilmes.modules.catalog.repository.SerieRepository;
import com.lucasm.lmsfilmes.shared.event.CatalogSyncEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class CatalogSyncListener {

    private final MovieRepository movieRepository;
    private final SerieRepository serieRepository;

    @Async
    @EventListener
    public void handleCatalogSync(CatalogSyncEvent event) {
        if (event.id() == null || event.id().isBlank()) return;

        if (event.isSerie()) {
            if (!serieRepository.existsById(event.id())) {
                Serie serie = new Serie();
                serie.setSerieId(event.id());
                serie.setTitle(event.title() != null ? event.title() : "Série " + event.id());
                serie.setPosterPath(event.posterPath());
                serieRepository.save(serie);
                log.info("Série sincronizada no banco local: {} ({})", serie.getTitle(), serie.getSerieId());
            }
        } else {
            if (!movieRepository.existsById(event.id())) {
                Movie movie = new Movie();
                movie.setMovieId(event.id());
                movie.setTitle(event.title() != null ? event.title() : "Filme " + event.id());
                movie.setPosterPath(event.posterPath());
                movieRepository.save(movie);
                log.info("Filme sincronizado no banco local: {} ({})", movie.getTitle(), movie.getMovieId());
            }
        }
    }
}
