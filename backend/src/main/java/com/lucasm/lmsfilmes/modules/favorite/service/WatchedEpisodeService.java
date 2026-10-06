package com.lucasm.lmsfilmes.modules.favorite.service;

import com.lucasm.lmsfilmes.core.exception.ResourceNotFoundException;
import com.lucasm.lmsfilmes.modules.auth.service.AuthService;
import com.lucasm.lmsfilmes.modules.catalog.dto.SeriesDTO;
import com.lucasm.lmsfilmes.modules.catalog.service.SerieService;
import com.lucasm.lmsfilmes.modules.favorite.dto.WatchedEpisodeRequestDTO;
import com.lucasm.lmsfilmes.modules.favorite.model.WatchedEpisode;
import com.lucasm.lmsfilmes.modules.favorite.repository.WatchedEpisodeRepository;
import com.lucasm.lmsfilmes.shared.event.CatalogSyncEvent;
import com.lucasm.lmsfilmes.shared.event.SerieProgressEvent;
import com.lucasm.lmsfilmes.shared.event.SerieRewatchEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class WatchedEpisodeService {

    private final WatchedEpisodeRepository watchedEpisodeRepository;
    private final AuthService authService;
    private final SerieService serieService;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional
    public WatchedEpisode markAsWatched(WatchedEpisodeRequestDTO dto, String email) {
        Long userId = authService.getUserIdByIdentifier(email);
        if (userId == null) throw new ResourceNotFoundException("Usuário não encontrado: " + email);

        String userKey = String.valueOf(userId);

        WatchedEpisode episode = watchedEpisodeRepository
                .findByUserIdAndSerieIdAndSeasonNumberAndEpisodeNumber(userKey, dto.getSerieId(), dto.getSeasonNumber(), dto.getEpisodeNumber())
                .orElseGet(() -> {
                    WatchedEpisode we = new WatchedEpisode();
                    we.setUserId(userKey);
                    we.setSerieId(dto.getSerieId());
                    we.setSeasonNumber(dto.getSeasonNumber());
                    we.setEpisodeNumber(dto.getEpisodeNumber());
                    return we;
                });

        WatchedEpisode saved = watchedEpisodeRepository.save(episode);

        // Notifica catálogo em memória se necessário
        eventPublisher.publishEvent(new CatalogSyncEvent(dto.getSerieId(), null, null, true));

        // Atualiza progresso da série em memória
        syncSerieProgress(userKey, email, dto.getSerieId());

        return saved;
    }

    @Transactional
    public void unmarkAsWatched(WatchedEpisodeRequestDTO dto, String email) {
        Long userId = authService.getUserIdByIdentifier(email);
        if (userId == null) return;

        String userKey = String.valueOf(userId);
        watchedEpisodeRepository.deleteByUserIdAndSerieIdAndSeasonNumberAndEpisodeNumber(
                userKey, dto.getSerieId(), dto.getSeasonNumber(), dto.getEpisodeNumber()
        );

        syncSerieProgress(userKey, email, dto.getSerieId());
    }

    public List<WatchedEpisode> getWatchedEpisodes(String serieId, String email) {
        Long userId = authService.getUserIdByIdentifier(email);
        if (userId == null) return List.of();

        return watchedEpisodeRepository.findByUserIdAndSerieIdOrderBySeasonNumberAscEpisodeNumberAsc(
                String.valueOf(userId), serieId
        );
    }

    @Transactional
    public void clearEpisodesForRewatch(String serieId, String email) {
        Long userId = authService.getUserIdByIdentifier(email);
        if (userId == null) return;

        String userKey = String.valueOf(userId);
        watchedEpisodeRepository.deleteByUserIdAndSerieId(userKey, serieId);

        // Dispara evento de rewatch em memória
        eventPublisher.publishEvent(new SerieRewatchEvent(serieId, email));
        syncSerieProgress(userKey, email, serieId);
    }

    private void syncSerieProgress(String userKey, String email, String serieId) {
        try {
            long watchedCount = watchedEpisodeRepository.countByUserIdAndSerieId(userKey, serieId);
            int totalEpisodes = 10;
            try {
                SeriesDTO details = serieService.getSeriesDetails(serieId, false);
                if (details != null && details.number_of_episodes() > 0) {
                    totalEpisodes = details.number_of_episodes();
                }
            } catch (Exception ignored) {}

            eventPublisher.publishEvent(new SerieProgressEvent(
                    serieId,
                    email,
                    (int) watchedCount,
                    totalEpisodes
            ));
        } catch (Exception e) {
            log.warn("Erro ao calcular progresso de episódios da série {}: {}", serieId, e.getMessage());
        }
    }
}
