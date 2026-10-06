package com.lucasm.lmsfilmes.modules.auth.service;

import com.lucasm.lmsfilmes.core.exception.ResourceNotFoundException;
import com.lucasm.lmsfilmes.core.security.JWTUtils;
import com.lucasm.lmsfilmes.modules.auth.dto.*;
import com.lucasm.lmsfilmes.modules.auth.model.PasswordResetToken;
import com.lucasm.lmsfilmes.modules.auth.model.User;
import com.lucasm.lmsfilmes.modules.auth.repository.PasswordResetTokenRepository;
import com.lucasm.lmsfilmes.modules.auth.repository.UserRepository;
import com.lucasm.lmsfilmes.shared.event.PasswordResetEvent;
import com.lucasm.lmsfilmes.shared.event.UserRegisteredEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository tokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JWTUtils jwtUtils;
    private final ApplicationEventPublisher eventPublisher;

    @Value("${frontend.base-url:http://localhost:3000}")
    private String frontendUrl;

    public AuthResponseDTO login(AuthDTO dto) {
        String identifier = dto.getEmail();
        if (identifier == null || identifier.isBlank()) {
            identifier = dto.getNickname();
        }
        if (identifier == null || identifier.isBlank()) {
            throw new BadCredentialsException("Email ou usuário é obrigatório");
        }

        User user = userRepository.findByEmailOrNickname(identifier.trim())
                .orElseThrow(() -> new BadCredentialsException("Credenciais inválidas"));

        if (!passwordEncoder.matches(dto.getPassword(), user.getPassword())) {
            throw new BadCredentialsException("Credenciais inválidas");
        }

        String token = jwtUtils.generateToken(user, user.getId(), user.getName(), user.getNickname(), user.getRole());

        return AuthResponseDTO.builder()
                .token(token)
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .nickname(user.getNickname())
                .role(user.getRole())
                .message("Login realizado com sucesso")
                .build();
    }

    @Transactional
    public AuthResponseDTO register(AuthDTO dto) {
        if (userRepository.existsByEmailIgnoreCase(dto.getEmail())) {
            throw new IllegalArgumentException("Este e-mail já está em uso");
        }
        if (dto.getNickname() != null && userRepository.existsByNicknameIgnoreCase(dto.getNickname())) {
            throw new IllegalArgumentException("Este apelido já está em uso");
        }

        User user = new User();
        user.setName(dto.getName());
        user.setEmail(dto.getEmail().toLowerCase().trim());
        user.setNickname(dto.getNickname() != null ? dto.getNickname().trim() : dto.getEmail().split("@")[0]);
        user.setPassword(passwordEncoder.encode(dto.getPassword()));
        user.setRole("USER");

        User savedUser = userRepository.save(user);

        // Publica evento em memória (envio assíncrono de boas-vindas sem RabbitMQ!)
        eventPublisher.publishEvent(new UserRegisteredEvent(savedUser.getNickname(), savedUser.getEmail()));

        String token = jwtUtils.generateToken(savedUser, savedUser.getId(), savedUser.getName(), savedUser.getNickname(), savedUser.getRole());

        return AuthResponseDTO.builder()
                .token(token)
                .id(savedUser.getId())
                .name(savedUser.getName())
                .email(savedUser.getEmail())
                .nickname(savedUser.getNickname())
                .role(savedUser.getRole())
                .message("Cadastro realizado com sucesso")
                .build();
    }

    @Transactional
    public ApiResponseDTO forgotPassword(String email) {
        if (email == null || email.isBlank()) {
            return new ApiResponseDTO(false, "E-mail inválido");
        }

        userRepository.findByEmailIgnoreCase(email.trim()).ifPresent(user -> {
            tokenRepository.deleteByUser(user);

            String token = UUID.randomUUID().toString();
            PasswordResetToken resetToken = new PasswordResetToken(token, user, 60); // 60 minutos
            tokenRepository.save(resetToken);

            String resetLink = frontendUrl + "/reset-password?token=" + token;

            // Publica evento em memória (envio assíncrono do e-mail de redefinição!)
            eventPublisher.publishEvent(new PasswordResetEvent(user.getEmail(), resetLink));
        });

        return new ApiResponseDTO(true, "Se o e-mail estiver cadastrado, as instruções foram enviadas.");
    }

    @Transactional
    public ApiResponseDTO resetPassword(String token, String newPassword) {
        PasswordResetToken resetToken = tokenRepository.findByToken(token)
                .orElseThrow(() -> new ResourceNotFoundException("Token inválido ou expirado"));

        if (resetToken.isExpired()) {
            tokenRepository.delete(resetToken);
            throw new IllegalArgumentException("Token expirado");
        }

        User user = resetToken.getUser();
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        tokenRepository.delete(resetToken);

        return new ApiResponseDTO(true, "Senha redefinida com sucesso!");
    }

    public Long getUserIdByIdentifier(String identifier) {
        if (identifier == null || identifier.isBlank()) return null;
        String trimmed = identifier.trim();
        try {
            return Long.parseLong(trimmed);
        } catch (NumberFormatException ignored) {}

        try {
            // Primeiro busca por email case-insensitive direto
            Optional<User> byEmail = userRepository.findByEmailIgnoreCase(trimmed);
            if (byEmail.isPresent()) {
                return byEmail.get().getId();
            }
            // Depois busca por nickname
            Optional<User> byNick = userRepository.findByNicknameIgnoreCase(trimmed);
            if (byNick.isPresent()) {
                return byNick.get().getId();
            }
            // Fallback pela query combinada
            return userRepository.findByEmailOrNickname(trimmed)
                    .map(User::getId)
                    .orElse(null);
        } catch (Exception e) {
            log.warn("Erro ao buscar userId pelo identificador '{}': {}", trimmed, e.getMessage());
            return null;
        }
    }

    public User getUserByIdentifier(String identifier) {
        if (identifier == null || identifier.isBlank()) return null;
        String trimmed = identifier.trim();
        try {
            Long id = Long.parseLong(trimmed);
            return userRepository.findById(id).orElse(null);
        } catch (NumberFormatException ignored) {}

        try {
            Optional<User> byEmail = userRepository.findByEmailIgnoreCase(trimmed);
            if (byEmail.isPresent()) return byEmail.get();

            Optional<User> byNick = userRepository.findByNicknameIgnoreCase(trimmed);
            if (byNick.isPresent()) return byNick.get();

            return userRepository.findByEmailOrNickname(trimmed).orElse(null);
        } catch (Exception e) {
            log.warn("Erro ao buscar User pelo identificador '{}': {}", trimmed, e.getMessage());
            return null;
        }
    }
}
