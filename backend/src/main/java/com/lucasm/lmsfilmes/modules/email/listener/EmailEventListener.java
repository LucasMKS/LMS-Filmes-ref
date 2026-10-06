package com.lucasm.lmsfilmes.modules.email.listener;

import com.lucasm.lmsfilmes.modules.email.service.EmailService;
import com.lucasm.lmsfilmes.shared.event.PasswordResetEvent;
import com.lucasm.lmsfilmes.shared.event.UserRegisteredEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class EmailEventListener {

    private final EmailService emailService;

    @Async
    @EventListener
    public void handleUserRegistered(UserRegisteredEvent event) {
        log.info("Processando evento em memória de cadastro: usuário={}, email={}", event.nickname(), event.email());
        emailService.sendWelcomeEmail(event.email(), event.nickname());
    }

    @Async
    @EventListener
    public void handlePasswordReset(PasswordResetEvent event) {
        log.info("Processando evento em memória de recuperação de senha: email={}", event.email());
        emailService.sendPasswordResetEmail(event.email(), event.resetLink());
    }
}
