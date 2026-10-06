package com.lucasm.lmsfilmes.modules.email.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

@Slf4j
@Service
public class EmailService {

    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;

    private final String fromAddress;
    private final String frontendUrl;

    public EmailService(
            JavaMailSender mailSender,
            TemplateEngine templateEngine,
            @Value("${spring.mail.username:noreply@lmsfilmes.com.br}") String fromAddress,
            @Value("${frontend.base-url:http://localhost:3000}") String frontendUrl) {
        this.mailSender = mailSender;
        this.templateEngine = templateEngine;
        this.fromAddress = fromAddress;
        this.frontendUrl = frontendUrl;
    }

    public void sendWelcomeEmail(String toAddress, String userName) {
        try {
            Context context = new Context();
            context.setVariable("userName", userName);
            context.setVariable("welcomeUrl", frontendUrl + "/login");

            String htmlBody = templateEngine.process("welcome-email", context);
            sendHtmlEmail(toAddress, "Boas-vindas ao LMS Filmes!", htmlBody);
            log.info("E-mail de boas-vindas enviado para: {}", toAddress);
        } catch (Exception e) {
            log.error("Erro ao enviar e-mail de boas-vindas para {}: {}", toAddress, e.getMessage());
        }
    }

    public void sendPasswordResetEmail(String toAddress, String resetLink) {
        try {
            Context context = new Context();
            context.setVariable("resetUrl", resetLink);

            String htmlBody = templateEngine.process("reset-password-email", context);
            sendHtmlEmail(toAddress, "Solicitação de Redefinição de Senha", htmlBody);
            log.info("E-mail de redefinição de senha enviado para: {}", toAddress);
        } catch (Exception e) {
            log.error("Erro ao enviar e-mail de redefinição para {}: {}", toAddress, e.getMessage());
        }
    }

    private void sendHtmlEmail(String toAddress, String subject, String htmlBody) throws MessagingException {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

        helper.setFrom(fromAddress);
        helper.setTo(toAddress);
        helper.setSubject(subject);
        helper.setText(htmlBody, true);

        mailSender.send(message);
    }
}
