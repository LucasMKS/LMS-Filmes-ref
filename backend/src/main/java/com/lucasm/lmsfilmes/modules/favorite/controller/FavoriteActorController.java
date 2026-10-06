package com.lucasm.lmsfilmes.modules.favorite.controller;

import com.lucasm.lmsfilmes.modules.favorite.model.FavoriteActor;
import com.lucasm.lmsfilmes.modules.favorite.service.FavoriteActorService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping({"/favorite/actors", "/lms-favorite/favorite/actors", "/lmsfavorite/favorite/actors"})
@RequiredArgsConstructor
public class FavoriteActorController {

    private final FavoriteActorService favoriteActorService;

    @GetMapping
    public ResponseEntity<List<FavoriteActor>> getUserActors(Authentication authentication) {
        return ResponseEntity.ok(favoriteActorService.getUserActors(authentication.getName()));
    }

    @PostMapping
    public ResponseEntity<FavoriteActor> addActor(
            @RequestBody FavoriteActor actor,
            Authentication authentication) {
        return ResponseEntity.ok(favoriteActorService.addActor(actor, authentication.getName()));
    }

    @DeleteMapping("/{actorId}")
    public ResponseEntity<Map<String, Boolean>> removeActor(
            @PathVariable String actorId,
            Authentication authentication) {
        favoriteActorService.removeActor(actorId, authentication.getName());
        return ResponseEntity.ok(Map.of("success", true));
    }

    @DeleteMapping
    public ResponseEntity<Map<String, Boolean>> clearActors(Authentication authentication) {
        favoriteActorService.clearActors(authentication.getName());
        return ResponseEntity.ok(Map.of("success", true));
    }

    @PostMapping("/sync")
    public ResponseEntity<List<FavoriteActor>> syncActors(
            @RequestBody List<FavoriteActor> actors,
            Authentication authentication) {
        return ResponseEntity.ok(favoriteActorService.syncActors(actors, authentication.getName()));
    }
}
