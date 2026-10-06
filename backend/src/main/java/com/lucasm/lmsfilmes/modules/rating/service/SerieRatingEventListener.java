package com.lucasm.lmsfilmes.modules.rating.service;

import com.lucasm.lmsfilmes.shared.event.SerieProgressEvent;
import com.lucasm.lmsfilmes.shared.event.SerieRewatchEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class SerieRatingEventListener {

    private final RateSerieService rateSerieService;

    @Async
    @EventListener
    public void handleSerieRewatch(SerieRewatchEvent event) {
        log.info("Processando evento em memória de rewatch da série {} pelo usuário {}", event.serieId(), event.email());
        try {
            rateSerieService.incrementRewatch(event.serieId(), event.email());
        } catch (Exception e) {
            log.error("Erro ao processar evento de rewatch em memória: {}", e.getMessage(), e);
        }
    }

    @Async
    @EventListener
    public void handleSerieProgress(SerieProgressEvent event) {
        log.info("Processando evento em memória de progresso da série {} pelo usuário {} ({} / {})",
                event.serieId(), event.email(), event.watchedEpisodes(), event.totalEpisodes());
        try {
            rateSerieService.updateProgress(event.serieId(), event.email(), event.watchedEpisodes(), event.totalEpisodes());
        } catch (Exception e) {
            log.error("Erro ao processar evento de progresso em memória: {}", e.getMessage(), e);
        }
    }
}
