package com.lucasm.lmsfilmes.modules.notification.scheduler;

import com.lucasm.lmsfilmes.modules.favorite.model.WatchlistMovie;
import com.lucasm.lmsfilmes.modules.favorite.model.WatchlistStatus;
import com.lucasm.lmsfilmes.modules.favorite.repository.WatchlistMovieRepository;
import com.lucasm.lmsfilmes.modules.notification.service.SseEmitterManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.Random;

@Slf4j
@Component
@RequiredArgsConstructor
public class MediaNotificationScheduler {

    private final WatchlistMovieRepository watchlistRepository;
    private final SseEmitterManager sseEmitterManager;

    @Value("${frontend.base-url:http://localhost:3000}")
    private String frontendUrl;

    /**
     * SESSÃO PIPOCA: Roda todos os dias às 18:30.
     * Sorteia um filme pendente da Watchlist para sugerir.
     */
    @Scheduled(cron = "0 30 18 * * *")
    public void suggestDailyMovie() {
        log.info("Scheduler Notificações: Iniciando sorteio do filme diário...");

        List<WatchlistMovie> eligibleMovies = watchlistRepository.findByStatusIn(
                List.of(WatchlistStatus.PLAN_TO_WATCH, WatchlistStatus.WATCHING)
        );

        if (eligibleMovies.isEmpty()) {
            log.info("Nenhum filme pendente na Watchlist para sugerir hoje.");
            return;
        }

        Random random = new Random();
        WatchlistMovie suggestedMovie = eligibleMovies.get(random.nextInt(eligibleMovies.size()));

        String movieLink = frontendUrl + "/filmes/" + suggestedMovie.getMovieId();

        Map<String, Object> payload = Map.of(
                "title", "🍿 Sessão Pipoca!",
                "message", "Filme escolhido da sua Watchlist para assistir hoje!",
                "movieId", suggestedMovie.getMovieId(),
                "link", movieLink
        );

        log.info("Enviando sugestão da Sessão Pipoca via canais em memória / SSE: {}", payload);
        sseEmitterManager.broadcast("POPCORN_SESSION", payload);
    }
}
