package com.lucasm.lmsfilmes.modules.catalog.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lucasm.lmsfilmes.core.exception.ResourceNotFoundException;
import com.lucasm.lmsfilmes.core.exception.TmdbApiException;
import com.lucasm.lmsfilmes.modules.catalog.dto.TmdbDTO;
import com.lucasm.lmsfilmes.modules.catalog.dto.TmdbPageDTO;
import com.lucasm.lmsfilmes.modules.catalog.dto.TmdbPersonCreditsDTO;
import com.lucasm.lmsfilmes.modules.catalog.dto.TmdbPersonDTO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;
import reactor.util.retry.Retry;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Collections;
import java.util.List;
import java.util.Map;

@Service
public class MovieService {

    private static final Logger logger = LoggerFactory.getLogger(MovieService.class);
    private static final int BATCH_MAX_SIZE = 100;
    private static final int BATCH_CONCURRENCY = 16;

    private final WebClient webClient;
    private final ObjectMapper objectMapper;
    private final ObjectProvider<MovieService> selfProvider;

    public MovieService(WebClient tmdbWebClient, ObjectMapper objectMapper, ObjectProvider<MovieService> selfProvider) {
        this.webClient = tmdbWebClient;
        this.objectMapper = objectMapper;
        this.selfProvider = selfProvider;
    }

    private String withLanguage(String path) {
        return path + (path.contains("?") ? "&" : "?") + "language=pt-BR";
    }

    private boolean isRetryable(Throwable throwable) {
        if (throwable instanceof WebClientResponseException wcre) {
            int status = wcre.getStatusCode().value();
            return status == 429 || status == 500 || status == 502 || status == 503 || status == 504;
        }
        return throwable instanceof TmdbApiException || throwable instanceof java.io.IOException;
    }

    private TmdbPageDTO<TmdbDTO> fetchPaginatedData(String path) {
        try {
            String body = webClient.get()
                    .uri(withLanguage(path))
                    .retrieve()
                    .onStatus(HttpStatusCode::isError, response ->
                            response.bodyToMono(String.class)
                                    .map(err -> new TmdbApiException(
                                            "Erro ao buscar dados do TMDB: status " + response.statusCode().value())))
                    .bodyToMono(String.class)
                    .retryWhen(Retry.backoff(3, Duration.ofMillis(250))
                            .filter(this::isRetryable))
                    .block();

            return objectMapper.readValue(body, new TypeReference<TmdbPageDTO<TmdbDTO>>() {});
        } catch (Exception e) {
            logger.warn("TMDB indisponível ou instável ao buscar ({}), retornando fallback vazio. Erro: {}", path, e.getMessage());
            return new TmdbPageDTO<>(1, Collections.emptyList(), 0, 0);
        }
    }

    @Cacheable(value = "moviesPopular", key = "#page")
    public TmdbPageDTO<TmdbDTO> getPopularMovies(int page) {
        return fetchPaginatedData("/movie/popular?page=" + page + "&region=BR");
    }

    @Cacheable(value = "moviesNowPlaying", key = "#page")
    public TmdbPageDTO<TmdbDTO> getNowPlayingMovies(int page) {
        return fetchPaginatedData("/movie/now_playing?page=" + page + "&region=BR");
    }

    @Cacheable(value = "moviesTopRated", key = "#page")
    public TmdbPageDTO<TmdbDTO> getTopRatedMovies(int page) {
        return fetchPaginatedData("/movie/top_rated?page=" + page);
    }

    @Cacheable(value = "moviesUpcoming", key = "#page")
    public TmdbPageDTO<TmdbDTO> getUpcomingMovies(int page) {
        return fetchPaginatedData("/movie/upcoming?page=" + page + "&region=BR");
    }

    @Cacheable(value = "movieDetails", key = "#movieId + '_' + #includeRecommendations")
    public TmdbDTO getMovieDetails(String movieId, boolean includeRecommendations) {
        try {
            String appendTo = includeRecommendations
                    ? "credits,videos,watch/providers,recommendations"
                    : "credits,videos,watch/providers";
            String path = withLanguage("/movie/" + movieId + "?append_to_response=" + appendTo);

            String body = webClient.get()
                    .uri(path)
                    .retrieve()
                    .onStatus(status -> status.value() == 404, response ->
                            Mono.error(new ResourceNotFoundException("Filme não encontrado: " + movieId)))
                    .onStatus(HttpStatusCode::isError, response ->
                            response.bodyToMono(String.class)
                                    .map(err -> new TmdbApiException(
                                            "Erro ao buscar detalhes do filme: status " + response.statusCode().value())))
                    .bodyToMono(String.class)
                    .retryWhen(Retry.backoff(3, Duration.ofMillis(250))
                            .filter(this::isRetryable))
                    .block();

            return objectMapper.readValue(body, TmdbDTO.class);
        } catch (ResourceNotFoundException e) {
            throw e;
        } catch (WebClientResponseException e) {
            logger.error("Erro HTTP ao buscar detalhes do filme {}: {}", movieId, e.getMessage());
            throw new TmdbApiException("Erro ao buscar detalhes do filme: " + e.getMessage(), e);
        } catch (Exception e) {
            logger.error("Erro ao buscar detalhes do filme {}: {}", movieId, e.getMessage(), e);
            throw new TmdbApiException("Erro ao buscar detalhes do filme: " + e.getMessage(), e);
        }
    }

    public TmdbPageDTO<TmdbDTO> searchMovies(String query, int page) {
        String encodedQuery = URLEncoder.encode(query, StandardCharsets.UTF_8);
        String path = "/search/movie?query=" + encodedQuery + "&include_adult=false&page=" + page;
        return fetchPaginatedData(path);
    }

    public Map<String, TmdbDTO> getMoviesBatch(List<String> movieIds) {
        if (movieIds == null || movieIds.isEmpty()) return Map.of();
        if (movieIds.size() > BATCH_MAX_SIZE) {
            throw new IllegalArgumentException("Limite de " + BATCH_MAX_SIZE + " filmes por batch excedido");
        }

        MovieService self = selfProvider.getObject();
        return Flux.fromIterable(movieIds)
                .flatMap(id -> Mono.fromCallable(() -> self.getMovieDetails(id, false))
                        .subscribeOn(Schedulers.boundedElastic())
                        .map(dto -> Map.entry(id, dto))
                        .onErrorResume(e -> {
                            logger.warn("Falha ao buscar filme {} no batch: {}", id, e.getMessage());
                            return Mono.empty();
                        }), BATCH_CONCURRENCY)
                .collectMap(Map.Entry::getKey, Map.Entry::getValue)
                .block();
    }

    @Cacheable(value = "actorsPopular", key = "#page")
    public TmdbPageDTO<TmdbPersonDTO> getPopularPeople(int page) {
        try {
            String path = withLanguage("/person/popular?page=" + page);
            String body = webClient.get()
                    .uri(path)
                    .retrieve()
                    .onStatus(HttpStatusCode::isError, response ->
                            response.bodyToMono(String.class)
                                    .map(err -> new TmdbApiException(
                                            "Erro ao buscar pessoas populares: status " + response.statusCode().value())))
                    .bodyToMono(String.class)
                    .retryWhen(Retry.backoff(3, Duration.ofMillis(250))
                            .filter(this::isRetryable))
                    .block();

            return objectMapper.readValue(body, new TypeReference<TmdbPageDTO<TmdbPersonDTO>>() {});
        } catch (Exception e) {
            logger.warn("Erro ao buscar pessoas populares: {}", e.getMessage());
            return new TmdbPageDTO<>(1, Collections.emptyList(), 0, 0);
        }
    }

    public TmdbPageDTO<TmdbPersonDTO> searchPeople(String query, int page) {
        String encodedQuery = URLEncoder.encode(query, StandardCharsets.UTF_8);
        String path = "/search/person?query=" + encodedQuery + "&include_adult=false&page=" + page;
        try {
            String body = webClient.get()
                    .uri(withLanguage(path))
                    .retrieve()
                    .onStatus(HttpStatusCode::isError, response ->
                            response.bodyToMono(String.class)
                                    .map(err -> new TmdbApiException(
                                            "Erro ao buscar pessoas do TMDB: status " + response.statusCode().value())))
                    .bodyToMono(String.class)
                    .retryWhen(Retry.backoff(3, Duration.ofMillis(250))
                            .filter(this::isRetryable))
                    .block();

            return objectMapper.readValue(body, new TypeReference<TmdbPageDTO<TmdbPersonDTO>>() {});
        } catch (Exception e) {
            logger.warn("TMDB indisponível ao buscar pessoas ({}), erro: {}", path, e.getMessage());
            return new TmdbPageDTO<>(1, Collections.emptyList(), 0, 0);
        }
    }

    @Cacheable(value = "actorDetails", key = "#personId")
    public TmdbPersonDTO getPersonDetails(String personId) {
        try {
            String path = withLanguage("/person/" + personId);
            String body = webClient.get()
                    .uri(path)
                    .retrieve()
                    .onStatus(status -> status.value() == 404, response ->
                            Mono.error(new ResourceNotFoundException("Pessoa não encontrada: " + personId)))
                    .onStatus(HttpStatusCode::isError, response ->
                            response.bodyToMono(String.class)
                                    .map(err -> new TmdbApiException(
                                            "Erro ao buscar detalhes da pessoa: status " + response.statusCode().value())))
                    .bodyToMono(String.class)
                    .retryWhen(Retry.backoff(3, Duration.ofMillis(250))
                            .filter(this::isRetryable))
                    .block();

            return objectMapper.readValue(body, TmdbPersonDTO.class);
        } catch (ResourceNotFoundException e) {
            throw e;
        } catch (Exception e) {
            logger.error("Erro ao buscar detalhes da pessoa {}: {}", personId, e.getMessage());
            throw new TmdbApiException("Erro ao buscar detalhes da pessoa: " + e.getMessage(), e);
        }
    }

    @Cacheable(value = "actorCredits", key = "#personId")
    public TmdbPersonCreditsDTO getPersonCredits(String personId) {
        try {
            String path = withLanguage("/person/" + personId + "/combined_credits");
            String body = webClient.get()
                    .uri(path)
                    .retrieve()
                    .onStatus(status -> status.value() == 404, response ->
                            Mono.error(new ResourceNotFoundException("Pessoa não encontrada: " + personId)))
                    .onStatus(HttpStatusCode::isError, response ->
                            response.bodyToMono(String.class)
                                    .map(err -> new TmdbApiException(
                                            "Erro ao buscar créditos da pessoa: status " + response.statusCode().value())))
                    .bodyToMono(String.class)
                    .retryWhen(Retry.backoff(3, Duration.ofMillis(250))
                            .filter(this::isRetryable))
                    .block();

            return objectMapper.readValue(body, TmdbPersonCreditsDTO.class);
        } catch (ResourceNotFoundException e) {
            throw e;
        } catch (Exception e) {
            logger.error("Erro ao buscar créditos da pessoa {}: {}", personId, e.getMessage());
            return new TmdbPersonCreditsDTO(Long.valueOf(personId), Collections.emptyList(), Collections.emptyList());
        }
    }
}
