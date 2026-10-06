package com.lucasm.lmsfilmes.modules.favorite.controller;

import com.lucasm.lmsfilmes.modules.favorite.dto.ActorListDTOs;
import com.lucasm.lmsfilmes.modules.favorite.service.ActorListService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping({"/favorite/actor-lists", "/lms-favorite/favorite/actor-lists", "/lmsfavorite/favorite/actor-lists"})
@RequiredArgsConstructor
public class ActorListController {

    private final ActorListService actorListService;

    @GetMapping
    public ResponseEntity<List<ActorListDTOs.Response>> getUserActorLists(Authentication authentication) {
        return ResponseEntity.ok(actorListService.getUserActorLists(authentication.getName()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ActorListDTOs.Response> getActorListById(
            @PathVariable Long id,
            Authentication authentication) {
        return ResponseEntity.ok(actorListService.getActorListById(id, authentication.getName()));
    }

    @PostMapping
    public ResponseEntity<ActorListDTOs.Response> createActorList(
            @RequestBody ActorListDTOs.Create dto,
            Authentication authentication) {
        return ResponseEntity.ok(actorListService.createActorList(dto, authentication.getName()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ActorListDTOs.Response> updateActorList(
            @PathVariable Long id,
            @RequestBody ActorListDTOs.Update dto,
            Authentication authentication) {
        return ResponseEntity.ok(actorListService.updateActorList(id, dto, authentication.getName()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Boolean>> deleteActorList(
            @PathVariable Long id,
            Authentication authentication) {
        actorListService.deleteActorList(id, authentication.getName());
        return ResponseEntity.ok(Map.of("success", true));
    }

    @PostMapping({"/{id}/actors", "/{id}/items"})
    public ResponseEntity<ActorListDTOs.Response> addActorToList(
            @PathVariable Long id,
            @RequestBody ActorListDTOs.AddItem dto,
            Authentication authentication) {
        return ResponseEntity.ok(actorListService.addActorToList(id, dto, authentication.getName()));
    }

    @DeleteMapping({"/{id}/actors/{actorId}", "/{id}/items/{actorId}"})
    public ResponseEntity<Map<String, Boolean>> removeActorFromList(
            @PathVariable Long id,
            @PathVariable String actorId,
            Authentication authentication) {
        actorListService.removeActorFromList(id, actorId, authentication.getName());
        return ResponseEntity.ok(Map.of("success", true));
    }
}
