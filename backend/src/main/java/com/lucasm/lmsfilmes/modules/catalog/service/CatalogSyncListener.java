package com.lucasm.lmsfilmes.modules.catalog.service;

import com.lucasm.lmsfilmes.modules.catalog.dto.SeriesDTO;
import com.lucasm.lmsfilmes.modules.catalog.dto.TmdbDTO;
import com.lucasm.lmsfilmes.modules.catalog.model.Movie;
import com.lucasm.lmsfilmes.modules.catalog.model.Serie;
import com.lucasm.lmsfilmes.modules.catalog.repository.MovieRepository;
import com.lucasm.lmsfilmes.modules.catalog.repository.SerieRepository;
import com.lucasm.lmsfilmes.shared.event.CatalogSyncEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.context.event.EventListener;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Slf4j
@Component
@RequiredArgsConstructor
public class CatalogSyncListener {

    private final MovieRepository movieRepository;
    private final SerieRepository serieRepository;
    private final ObjectProvider<MovieService> movieServiceProvider;
    private final ObjectProvider<SerieService> serieServiceProvider;

    @EventListener
    public void handleCatalogSync(CatalogSyncEvent event) {
        if (event.id() == null || event.id().isBlank()) return;

        String id = event.id().trim();
        String title = event.title();
        String posterPath = event.posterPath();

        if (event.isSerie()) {
            syncSerie(id, title, posterPath);
        } else {
            syncMovie(id, title, posterPath);
        }
    }

    public Movie syncMovie(String movieId, String title, String posterPath) {
        try {
            Optional<Movie> existingOpt = movieRepository.findById(movieId);
            if (existingOpt.isPresent()) {
                Movie existing = existingOpt.get();
                boolean needUpdate = false;
                if ((existing.getTitle() == null || existing.getTitle().startsWith("Filme ")) && title != null && !title.isBlank() && !title.startsWith("Filme ")) {
                    existing.setTitle(title);
                    needUpdate = true;
                }
                if ((existing.getPosterPath() == null || existing.getPosterPath().isBlank()) && posterPath != null && !posterPath.isBlank()) {
                    existing.setPosterPath(posterPath);
                    needUpdate = true;
                }
                if (needUpdate) {
                    return movieRepository.saveAndFlush(existing);
                }
                return existing;
            }

            // Se título ou poster não foram fornecidos, tenta obter do TMDB
            if ((title == null || title.isBlank() || posterPath == null || posterPath.isBlank())) {
                try {
                    MovieService movieService = movieServiceProvider.getIfAvailable();
                    if (movieService != null) {
                        TmdbDTO details = movieService.getMovieDetails(movieId, false);
                        if (details != null) {
                            if (title == null || title.isBlank()) {
                                title = details.title() != null && !details.title().isBlank()
                                        ? details.title()
                                        : details.original_title();
                            }
                            if (posterPath == null || posterPath.isBlank()) {
                                posterPath = details.poster_path();
                            }
                        }
                    }
                } catch (Exception e) {
                    log.warn("Não foi possível buscar metadados TMDB para filme {}: {}", movieId, e.getMessage());
                }
            }

            Movie movie = new Movie();
            movie.setMovieId(movieId);
            movie.setTitle(title != null && !title.isBlank() ? title : "Filme " + movieId);
            movie.setPosterPath(posterPath);
            Movie saved = movieRepository.saveAndFlush(movie);
            log.info("Filme sincronizado no banco local: {} ({})", saved.getTitle(), saved.getMovieId());
            return saved;
        } catch (DataIntegrityViolationException e) {
            log.debug("Filme {} já inserido concorrentemente", movieId);
            return movieRepository.findById(movieId).orElse(null);
        } catch (Exception e) {
            log.error("Erro ao sincronizar filme {}: {}", movieId, e.getMessage(), e);
            return null;
        }
    }

    public Serie syncSerie(String serieId, String title, String posterPath) {
        try {
            Optional<Serie> existingOpt = serieRepository.findById(serieId);
            if (existingOpt.isPresent()) {
                Serie existing = existingOpt.get();
                boolean needUpdate = false;
                if ((existing.getTitle() == null || existing.getTitle().startsWith("Série ")) && title != null && !title.isBlank() && !title.startsWith("Série ")) {
                    existing.setTitle(title);
                    needUpdate = true;
                }
                if ((existing.getPosterPath() == null || existing.getPosterPath().isBlank()) && posterPath != null && !posterPath.isBlank()) {
                    existing.setPosterPath(posterPath);
                    needUpdate = true;
                }
                if (needUpdate) {
                    return serieRepository.saveAndFlush(existing);
                }
                return existing;
            }

            // Se título ou poster não foram fornecidos, tenta obter do TMDB
            if ((title == null || title.isBlank() || posterPath == null || posterPath.isBlank())) {
                try {
                    SerieService serieService = serieServiceProvider.getIfAvailable();
                    if (serieService != null) {
                        SeriesDTO details = serieService.getSeriesDetails(serieId, false);
                        if (details != null) {
                            if (title == null || title.isBlank()) {
                                title = details.name();
                            }
                            if (posterPath == null || posterPath.isBlank()) {
                                posterPath = details.poster_path();
                            }
                        }
                    }
                } catch (Exception e) {
                    log.warn("Não foi possível buscar metadados TMDB para série {}: {}", serieId, e.getMessage());
                }
            }

            Serie serie = new Serie();
            serie.setSerieId(serieId);
            serie.setTitle(title != null && !title.isBlank() ? title : "Série " + serieId);
            serie.setPosterPath(posterPath);
            Serie saved = serieRepository.saveAndFlush(serie);
            log.info("Série sincronizada no banco local: {} ({})", saved.getTitle(), saved.getSerieId());
            return saved;
        } catch (DataIntegrityViolationException e) {
            log.debug("Série {} já inserida concorrentemente", serieId);
            return serieRepository.findById(serieId).orElse(null);
        } catch (Exception e) {
            log.error("Erro ao sincronizar série {}: {}", serieId, e.getMessage(), e);
            return null;
        }
    }
}
