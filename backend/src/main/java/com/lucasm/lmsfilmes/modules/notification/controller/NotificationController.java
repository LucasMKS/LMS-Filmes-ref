package com.lucasm.lmsfilmes.modules.notification.controller;

import com.lucasm.lmsfilmes.modules.notification.service.SseEmitterManager;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.Map;

@RestController
@RequestMapping({"/notifications", "/lms-favorite/notifications", "/lmsfavorite/notifications"})
@RequiredArgsConstructor
public class NotificationController {

    private final SseEmitterManager sseEmitterManager;

    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter stream(
            Authentication authentication,
            HttpServletResponse response) {

        response.setHeader("X-Accel-Buffering", "no");
        response.setHeader("Cache-Control", "no-cache, no-transform");
        response.setHeader("Connection", "keep-alive");

        String userKey = (authentication != null && authentication.isAuthenticated())
                ? authentication.getName()
                : null;

        return sseEmitterManager.createEmitter(userKey);
    }

    @PostMapping("/broadcast")
    public ResponseEntity<Map<String, Boolean>> broadcastNotification(
            @RequestBody Map<String, String> payload) {
        String eventName = payload.getOrDefault("event", "NOTIFICATION");
        String message = payload.getOrDefault("message", "");
        sseEmitterManager.broadcast(eventName, payload);
        return ResponseEntity.ok(Map.of("success", true));
    }
}
