package com.lucasm.lmsfilmes.modules.favorite.service;

import com.lucasm.lmsfilmes.core.exception.ResourceNotFoundException;
import com.lucasm.lmsfilmes.modules.auth.service.AuthService;
import com.lucasm.lmsfilmes.modules.favorite.model.FavoriteActor;
import com.lucasm.lmsfilmes.modules.favorite.repository.FavoriteActorRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class FavoriteActorService {

    private final FavoriteActorRepository favoriteActorRepository;
    private final AuthService authService;

    public List<FavoriteActor> getUserActors(String email) {
        Long userId = authService.getUserIdByIdentifier(email);
        if (userId == null) return List.of();
        return favoriteActorRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    @Transactional
    public FavoriteActor addActor(FavoriteActor actor, String email) {
        Long userId = authService.getUserIdByIdentifier(email);
        if (userId == null) throw new ResourceNotFoundException("Usuário não encontrado: " + email);

        return favoriteActorRepository.findByUserIdAndActorId(userId, actor.getActorId())
                .orElseGet(() -> {
                    actor.setUserId(userId);
                    return favoriteActorRepository.save(actor);
                });
    }

    @Transactional
    public void removeActor(String actorId, String email) {
        Long userId = authService.getUserIdByIdentifier(email);
        if (userId == null) return;
        favoriteActorRepository.deleteByUserIdAndActorId(userId, actorId);
    }

    @Transactional
    public void clearActors(String email) {
        Long userId = authService.getUserIdByIdentifier(email);
        if (userId == null) return;
        favoriteActorRepository.deleteByUserId(userId);
    }

    @Transactional
    public List<FavoriteActor> syncActors(List<FavoriteActor> actors, String email) {
        Long userId = authService.getUserIdByIdentifier(email);
        if (userId == null) throw new ResourceNotFoundException("Usuário não encontrado");

        for (FavoriteActor actor : actors) {
            if (!favoriteActorRepository.existsByUserIdAndActorId(userId, actor.getActorId())) {
                actor.setId(null);
                actor.setUserId(userId);
                favoriteActorRepository.save(actor);
            }
        }
        return favoriteActorRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }
}
