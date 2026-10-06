package com.lucasm.lmsfilmes.core.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

@Component
public class JWTUtils {

    private final SecretKey key;
    private final long expirationTime;

    public JWTUtils(
            @Value("${jwt.auth.secret}") String secret,
            @Value("${jwt.auth.expiration:604800000}") long expirationTime) {
        byte[] keyBytes;
        try {
            keyBytes = Base64.getDecoder().decode(secret.getBytes(StandardCharsets.UTF_8));
        } catch (IllegalArgumentException e) {
            keyBytes = secret.getBytes(StandardCharsets.UTF_8);
        }
        this.key = Keys.hmacShaKeyFor(keyBytes);
        this.expirationTime = expirationTime;
    }

    public String generateToken(UserDetails userDetails, Long id, String name, String nickname, String role) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("id", id != null ? id : "");
        claims.put("name", name != null ? name : "");
        claims.put("nickname", nickname != null ? nickname : "");
        claims.put("role", role != null ? role : "USER");

        return Jwts.builder()
                .claims(claims)
                .subject(userDetails.getUsername())
                .issuedAt(new Date(System.currentTimeMillis()))
                .expiration(new Date(System.currentTimeMillis() + expirationTime))
                .signWith(key)
                .compact();
    }

    public String extractUsername(String token) {
        return extractClaims(token, Claims::getSubject);
    }

    public String extractUserId(String token) {
        return extractClaims(token, claims -> {
            Object id = claims.get("id");
            return id != null ? String.valueOf(id) : null;
        });
    }

    public String extractName(String token) {
        return extractClaims(token, claims -> {
            Object name = claims.get("name");
            return name != null ? String.valueOf(name) : null;
        });
    }

    public String extractNickname(String token) {
        return extractClaims(token, claims -> {
            Object nick = claims.get("nickname");
            return nick != null ? String.valueOf(nick) : null;
        });
    }

    public String extractRole(String token) {
        return extractClaims(token, claims -> {
            Object role = claims.get("role");
            return role != null ? String.valueOf(role) : "USER";
        });
    }

    public boolean isTokenValid(String token, UserDetails userDetails) {
        final String username = extractUsername(token);
        return (username != null && username.equalsIgnoreCase(userDetails.getUsername()) && !isTokenExpired(token));
    }

    public boolean isTokenValid(String token) {
        try {
            return !isTokenExpired(token);
        } catch (Exception e) {
            return false;
        }
    }

    public boolean isTokenExpired(String token) {
        return extractClaims(token, Claims::getExpiration).before(new Date());
    }

    private <T> T extractClaims(String token, Function<Claims, T> claimsTFunction) {
        return claimsTFunction.apply(Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload());
    }
}
