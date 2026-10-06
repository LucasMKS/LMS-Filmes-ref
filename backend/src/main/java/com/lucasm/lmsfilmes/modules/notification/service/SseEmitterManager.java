package com.lucasm.lmsfilmes.modules.notification.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@Slf4j
@Component
public class SseEmitterManager {

    private final Map<String, List<SseEmitter>> userEmitters = new ConcurrentHashMap<>();
    private final List<SseEmitter> broadcastEmitters = new CopyOnWriteArrayList<>();

    public SseEmitter createEmitter(String userKey) {
        // Timeout de 30 minutos
        SseEmitter emitter = new SseEmitter(30 * 60 * 1000L);

        if (userKey != null && !userKey.isBlank()) {
            userEmitters.computeIfAbsent(userKey, k -> new CopyOnWriteArrayList<>()).add(emitter);
        } else {
            broadcastEmitters.add(emitter);
        }

        emitter.onCompletion(() -> removeEmitter(userKey, emitter));
        emitter.onTimeout(() -> removeEmitter(userKey, emitter));
        emitter.onError(e -> removeEmitter(userKey, emitter));

        try {
            emitter.send(SseEmitter.event()
                    .name("CONNECTED")
                    .data(Map.of("message", "Conexão SSE estabelecida com sucesso")));
        } catch (Exception e) {
            log.warn("Erro ao enviar evento de conexão SSE: {}", e.getMessage());
            removeEmitter(userKey, emitter);
        }

        return emitter;
    }

    public void sendToUser(String userKey, String eventName, Object data) {
        List<SseEmitter> emitters = userEmitters.get(userKey);
        if (emitters != null) {
            for (SseEmitter emitter : emitters) {
                try {
                    emitter.send(SseEmitter.event().name(eventName).data(data));
                } catch (IOException e) {
                    removeEmitter(userKey, emitter);
                }
            }
        }
    }

    public void broadcast(String eventName, Object data) {
        // Envia para todos os inscritos anônimos e logados
        for (SseEmitter emitter : broadcastEmitters) {
            try {
                emitter.send(SseEmitter.event().name(eventName).data(data));
            } catch (IOException e) {
                broadcastEmitters.remove(emitter);
            }
        }
        for (Map.Entry<String, List<SseEmitter>> entry : userEmitters.entrySet()) {
            for (SseEmitter emitter : entry.getValue()) {
                try {
                    emitter.send(SseEmitter.event().name(eventName).data(data));
                } catch (IOException e) {
                    removeEmitter(entry.getKey(), emitter);
                }
            }
        }
    }

    @Scheduled(fixedRate = 25000)
    public void sendHeartbeat() {
        if (broadcastEmitters.isEmpty() && userEmitters.isEmpty()) {
            return;
        }

        SseEmitter.SseEventBuilder ping = SseEmitter.event().name("PING").data("keep-alive");

        for (SseEmitter emitter : broadcastEmitters) {
            try {
                emitter.send(ping);
            } catch (Exception e) {
                broadcastEmitters.remove(emitter);
            }
        }

        for (Map.Entry<String, List<SseEmitter>> entry : userEmitters.entrySet()) {
            for (SseEmitter emitter : entry.getValue()) {
                try {
                    emitter.send(ping);
                } catch (Exception e) {
                    removeEmitter(entry.getKey(), emitter);
                }
            }
        }
    }

    private void removeEmitter(String userKey, SseEmitter emitter) {
        if (userKey != null && !userKey.isBlank()) {
            List<SseEmitter> list = userEmitters.get(userKey);
            if (list != null) {
                list.remove(emitter);
                if (list.isEmpty()) {
                    userEmitters.remove(userKey);
                }
            }
        } else {
            broadcastEmitters.remove(emitter);
        }
    }
}
