package com.lucasm.lmsfilmes.modules.rating.controller;

import com.lucasm.lmsfilmes.modules.rating.dto.DashboardStatsDTO;
import com.lucasm.lmsfilmes.modules.rating.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping({"/rate/dashboard", "/lms-rating/rate/dashboard", "/lmsrating/rate/dashboard", "/dashboard"})
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/stats")
    public ResponseEntity<DashboardStatsDTO> getStats(Authentication authentication) {
        return ResponseEntity.ok(dashboardService.getUserStats(authentication.getName()));
    }
}
