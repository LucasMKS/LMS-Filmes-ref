package com.lucasm.lmsfilmes.modules.rating.controller;

import com.lucasm.lmsfilmes.modules.rating.dto.MediaBalanceDTO;
import com.lucasm.lmsfilmes.modules.rating.service.MediaStatsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping({"/stats", "/lms-rating/stats", "/lmsrating/stats"})
@RequiredArgsConstructor
public class MediaStatsController {

    private final MediaStatsService mediaStatsService;

    @GetMapping("/balance")
    public ResponseEntity<List<MediaBalanceDTO>> getBalance(Authentication authentication) {
        return ResponseEntity.ok(mediaStatsService.getMediaBalance(authentication.getName()));
    }
}
