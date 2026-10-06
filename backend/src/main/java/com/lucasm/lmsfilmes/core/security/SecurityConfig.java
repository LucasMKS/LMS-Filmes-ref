package com.lucasm.lmsfilmes.core.security;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JWTAuthFilter jwtAuthFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(Customizer.withDefaults())
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // Rotas públicas de autenticação
                        .requestMatchers(
                                "/auth/**",
                                "/lms-filmes/auth/**",
                                "/lmsfilmes/auth/**"
                        ).permitAll()

                        // Rotas de leitura do catálogo TMDB (livres)
                        .requestMatchers(HttpMethod.GET,
                                "/movies/**",
                                "/lms-filmes/movies/**",
                                "/lmsfilmes/movies/**",
                                "/series/**",
                                "/lms-filmes/series/**",
                                "/lmsfilmes/series/**"
                        ).permitAll()

                        // Endpoints de monitoramento e SSE stream
                        .requestMatchers(
                                "/actuator/**",
                                "/notifications/stream",
                                "/lms-favorite/notifications/stream",
                                "/lmsfavorite/notifications/stream",
                                "/lms-filmes/notifications/stream",
                                "/lmsfilmes/notifications/stream"
                        ).permitAll()

                        // Todas as rotas protegidas
                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration configuration) throws Exception {
        return configuration.getAuthenticationManager();
    }
}
