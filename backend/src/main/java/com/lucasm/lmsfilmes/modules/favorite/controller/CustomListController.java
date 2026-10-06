package com.lucasm.lmsfilmes.modules.favorite.controller;

import com.lucasm.lmsfilmes.modules.favorite.dto.CustomListDTOs;
import com.lucasm.lmsfilmes.modules.favorite.service.CustomListService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping({
        "/custom-lists", "/lms-favorite/custom-lists", "/lmsfavorite/custom-lists",
        "/favorite/custom-lists", "/lms-favorite/favorite/custom-lists", "/lmsfavorite/favorite/custom-lists"
})
@RequiredArgsConstructor
public class CustomListController {

    private final CustomListService customListService;

    @GetMapping
    public ResponseEntity<List<CustomListDTOs.Response>> getUserLists(Authentication authentication) {
        return ResponseEntity.ok(customListService.getUserLists(authentication.getName()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<CustomListDTOs.Response> getListById(
            @PathVariable Long id,
            Authentication authentication) {
        return ResponseEntity.ok(customListService.getListById(id, authentication.getName()));
    }

    @PostMapping
    public ResponseEntity<CustomListDTOs.Response> createList(
            @RequestBody CustomListDTOs.Create dto,
            Authentication authentication) {
        return ResponseEntity.ok(customListService.createList(dto, authentication.getName()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CustomListDTOs.Response> updateList(
            @PathVariable Long id,
            @RequestBody CustomListDTOs.Update dto,
            Authentication authentication) {
        return ResponseEntity.ok(customListService.updateList(id, dto, authentication.getName()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Boolean>> deleteList(
            @PathVariable Long id,
            Authentication authentication) {
        customListService.deleteList(id, authentication.getName());
        return ResponseEntity.ok(Map.of("success", true));
    }

    @PostMapping("/{id}/items")
    public ResponseEntity<CustomListDTOs.Response> addItem(
            @PathVariable Long id,
            @RequestBody CustomListDTOs.AddItem dto,
            Authentication authentication) {
        return ResponseEntity.ok(customListService.addItemToList(id, dto, authentication.getName()));
    }

    @DeleteMapping("/{id}/items")
    public ResponseEntity<Map<String, Boolean>> removeItem(
            @PathVariable Long id,
            @RequestParam String mediaId,
            @RequestParam String mediaType,
            Authentication authentication) {
        customListService.removeItemFromList(id, mediaId, mediaType, authentication.getName());
        return ResponseEntity.ok(Map.of("success", true));
    }
}
